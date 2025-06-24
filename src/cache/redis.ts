/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * 💾 Resilient Redis Client - Production Grade
 * 
 * Features:
 * - Graceful fallback when Redis is not available
 * - Circuit breaker pattern for fault tolerance
 * - Handles missing @upstash/redis package
 * - Safe for projects that don't use Redis
 * - Connection pooling and retry logic
 * - Health monitoring and metrics
 */

import { CACHE_CONFIG } from './config';
import type { RedisStatus } from './types';

// Type for Redis client (to avoid import errors if package not installed)
interface RedisClient {
    ping(): Promise<string>;
    get(key: string): Promise<unknown>;
    setex(key: string, ttl: number, value: unknown): Promise<string>;
    del(key: string): Promise<number>;
    // Add more Redis methods as needed
    exists(key: string): Promise<number>;
    ttl(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
}

export class ResilientRedis {
    private redis: RedisClient | null = null;
    private isConnected = false;
    private circuitOpen = false;
    private failureCount = 0;
    private lastFailure = 0;
    private connectionAttempts = 0;
    private lastConnectionAttempt = 0;
    private redisAvailable = false;
    private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private operationMetrics = {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        avgResponseTime: 0,
        lastOperationTime: 0
    };

    private status: RedisStatus = {
        available: false,
        connected: false,
        circuitOpen: false,
        failures: 0,
        lastFailure: 0,
        mode: 'unavailable'
    };

    constructor() {
        this.checkRedisAvailability();
        if (this.redisAvailable) {
            this.initializeRedis();
            this.startHealthMonitoring();
        }

        // Cleanup on process exit
        process.on('exit', () => this.cleanup());
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());
    }

    /**
     * Check if Redis package and configuration are available
     */
    private checkRedisAvailability(): void {
        try {
            // Check if @upstash/redis package is installed
            require.resolve('@upstash/redis');

            // Check if Redis is enabled in config
            if (!CACHE_CONFIG.ENABLE_REDIS) {
                if (CACHE_CONFIG.ENABLE_LOGGING) {
                    console.log('[REDIS] Disabled in configuration');
                }
                return;
            }

            // Check if Redis credentials are provided
            if (!CACHE_CONFIG.REDIS_URL || !CACHE_CONFIG.REDIS_TOKEN) {
                if (CACHE_CONFIG.ENABLE_LOGGING) {
                    console.log('[REDIS] Credentials not provided - running in memory-only mode');
                }
                return;
            }

            this.redisAvailable = true;

        } catch (error) {
            if (CACHE_CONFIG.ENABLE_LOGGING) {
                console.error('[REDIS] Error checking availability:', error);
                console.log('[REDIS] Package not installed - graceful fallback to memory-only mode');
            }
            this.redisAvailable = false;
        }
    }

    /**
     * Initialize Redis connection (only if available)
     */
    private async initializeRedis(): Promise<void> {
        if (!this.redisAvailable) {
            return;
        }

        // Prevent concurrent initialization attempts
        if (this.lastConnectionAttempt && Date.now() - this.lastConnectionAttempt < 5000) {
            return;
        }

        this.lastConnectionAttempt = Date.now();
        this.connectionAttempts++;

        try {
            // Try to dynamically import Redis - this should work at runtime if package is installed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let redisModule: any = null;
            try {
                redisModule = await import('@upstash/redis');
            } catch (importError) {
                this.log('[REDIS] @upstash/redis package not found - running in memory-only mode');
                this.redis = null;
                this.status.available = false;
                this.status.mode = 'unavailable';
                this.redisAvailable = false;
                return;
            }

            const { Redis } = redisModule;

            // Create Redis instance with timeout and retry configuration
            this.redis = new Redis({
                url: CACHE_CONFIG.REDIS_URL,
                token: CACHE_CONFIG.REDIS_TOKEN,
                retry: {
                    retries: 3,
                    backoff: (retryCount: number) => Math.exp(retryCount) * 50,
                },
                // Set connection timeout
                automaticDeserialization: true,
            });

            // Test connection with timeout
            const connectionPromise = this.redis!.ping();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timeout')), CACHE_CONFIG.REDIS_TIMEOUT)
            );

            await Promise.race([connectionPromise, timeoutPromise]);

            this.isConnected = true;
            this.resetCircuit();
            this.updateStatus();

            this.log('[REDIS] Connected successfully');

        } catch (error) {
            this.redis = null;
            this.isConnected = false;
            this.recordFailure();
            this.updateStatus();

            this.log(`[REDIS] Connection failed (attempt ${this.connectionAttempts}): ${error instanceof Error ? error.message : 'Unknown error'}`);

            // Schedule reconnection if under max attempts
            if (this.connectionAttempts < 5) {
                this.scheduleReconnection();
            }
        }
    }

    /**
     * Get value from Redis with enhanced error handling and metrics
     */
    async get(key: string): Promise<unknown> {
        if (!this.isAvailable()) {
            return null;
        }

        const startTime = Date.now();
        this.operationMetrics.totalOperations++;

        try {
            const result = await Promise.race([
                this.redis!.get(key),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), CACHE_CONFIG.REDIS_TIMEOUT)
                )
            ]);

            this.recordSuccessfulOperation(startTime);
            return result;

        } catch (error) {
            this.recordFailedOperation(startTime);
            this.recordFailure();
            this.log(`[REDIS] Get operation failed for key "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }

    /**
     * Set value in Redis with expiration
     */
    async setex(key: string, ttl: number, data: unknown): Promise<boolean> {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            await Promise.race([
                this.redis!.setex(key, ttl, data),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), CACHE_CONFIG.REDIS_TIMEOUT)
                )
            ]);

            this.resetCircuit();
            return true;

        } catch (error) {
            this.recordFailure();
            return false;
        }
    }

    /**
     * Delete key from Redis
     */
    async del(key: string): Promise<boolean> {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            await this.redis!.del(key);
            this.resetCircuit();
            return true;
        } catch (error) {
            this.recordFailure();
            return false;
        }
    }

    /**
     * Check if Redis is available for operations
     */
    private isAvailable(): boolean {
        // If Redis was never initialized, it's not available
        if (!this.redisAvailable || !this.redis) {
            return false;
        }

        // If circuit breaker is disabled, always try
        if (!CACHE_CONFIG.ENABLE_CIRCUIT_BREAKER) {
            return true;
        }

        // Circuit breaker logic
        if (this.circuitOpen) {
            const now = Date.now();
            if (now - this.lastFailure < CACHE_CONFIG.CIRCUIT_RESET_TIMEOUT) {
                return false; // Circuit still open
            } else {
                // Try to reset circuit
                this.circuitOpen = false;
                this.failureCount = Math.max(0, this.failureCount - 1);
            }
        }

        return true;
    }

    /**
     * Record a failure and potentially open circuit
     */
    private recordFailure(): void {
        this.failureCount++;
        this.lastFailure = Date.now();

        if (this.failureCount >= CACHE_CONFIG.CIRCUIT_FAILURE_THRESHOLD) {
            this.circuitOpen = true;
            this.isConnected = false;

            if (CACHE_CONFIG.ENABLE_LOGGING) {
                console.log('[REDIS] Circuit breaker opened - too many failures');
            }
        }
    }

    /**
     * Reset circuit breaker
     */
    private resetCircuit(): void {
        if (this.failureCount > 0 || this.circuitOpen) {
            this.failureCount = 0;
            this.circuitOpen = false;
            this.isConnected = true;

            if (CACHE_CONFIG.ENABLE_LOGGING) {
                console.log('[REDIS] Circuit breaker reset - connection restored');
            }
        }
    }

    /**
     * Get Redis connection status
     */
    getConnectionStatus(): RedisStatus {
        return {
            available: this.redisAvailable,
            connected: this.isConnected,
            circuitOpen: this.circuitOpen,
            failures: this.failureCount,
            lastFailure: this.lastFailure,
            mode: !this.redisAvailable ? 'unavailable' :
                this.circuitOpen ? 'circuit-open' :
                    this.isConnected ? 'connected' : 'disconnected'
        };
    }

    /**
     * Force retry connection (for admin/debugging)
     */
    async forceReconnect(): Promise<boolean> {
        if (!this.redisAvailable) {
            return false;
        }

        this.resetCircuit();
        await this.initializeRedis();
        return this.isConnected;
    }

    /**
     * Get Redis health info
     */
    async getHealthInfo(): Promise<{
        available: boolean;
        connected: boolean;
        latency?: number;
        error?: string;
    }> {
        if (!this.isAvailable()) {
            return {
                available: this.redisAvailable,
                connected: false,
                error: this.redisAvailable ? 'Circuit breaker open' : 'Redis not available'
            };
        }

        try {
            const start = Date.now();
            await this.redis!.ping();
            const latency = Date.now() - start;

            return {
                available: true,
                connected: true,
                latency
            };

        } catch (error) {
            return {
                available: this.redisAvailable,
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Log messages (internal logging method)
     */
    private log(message: string): void {
        if (CACHE_CONFIG.ENABLE_LOGGING) {
            console.log(`[${new Date().toISOString()}] ${message}`);
        }
    }

    /**
     * Update internal status object
     */
    private updateStatus(): void {
        this.status = {
            available: this.redisAvailable,
            connected: this.isConnected,
            circuitOpen: this.circuitOpen,
            failures: this.failureCount,
            lastFailure: this.lastFailure,
            mode: !this.redisAvailable ? 'unavailable' :
                this.circuitOpen ? 'circuit-open' :
                    this.isConnected ? 'connected' : 'disconnected'
        };
    }

    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnection(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        const delay = Math.min(5000 * Math.pow(2, this.connectionAttempts - 1), 30000); // Exponential backoff, max 30s

        this.reconnectTimeout = setTimeout(() => {
            this.log(`[REDIS] Attempting reconnection (${this.connectionAttempts + 1}/5)`);
            this.initializeRedis();
        }, delay);
    }

    /**
     * Record successful operation for metrics
     */
    private recordSuccessfulOperation(startTime: number): void {
        this.operationMetrics.successfulOperations++;
        const responseTime = Date.now() - startTime;
        this.operationMetrics.lastOperationTime = responseTime;

        // Update average response time (rolling average)
        this.operationMetrics.avgResponseTime =
            (this.operationMetrics.avgResponseTime * (this.operationMetrics.successfulOperations - 1) + responseTime) /
            this.operationMetrics.successfulOperations;
    }

    /**
     * Record failed operation for metrics
     */
    private recordFailedOperation(startTime: number): void {
        this.operationMetrics.failedOperations++;
        this.operationMetrics.lastOperationTime = Date.now() - startTime;
    }

    /**
     * Start health monitoring (periodic health checks)
     */
    private startHealthMonitoring(): void {
        if (!this.redisAvailable || this.healthCheckInterval) {
            return;
        }

        // Health check every 30 seconds
        this.healthCheckInterval = setInterval(async () => {
            if (this.isConnected && this.redis) {
                try {
                    await Promise.race([
                        this.redis.ping(),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Health check timeout')), 5000)
                        )
                    ]);

                    // If we were disconnected, log reconnection
                    if (!this.isConnected) {
                        this.log('[REDIS] Health check passed - connection restored');
                        this.isConnected = true;
                        this.resetCircuit();
                        this.updateStatus();
                    }

                } catch (error) {
                    this.log(`[REDIS] Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    this.isConnected = false;
                    this.recordFailure();
                    this.updateStatus();
                }
            } else if (!this.isConnected && this.redisAvailable && !this.circuitOpen) {
                // Try to reconnect if we're not connected but Redis should be available
                this.log('[REDIS] Health check: attempting reconnection');
                this.initializeRedis();
            }
        }, 30000);
    }

    /**
     * Cleanup resources
     */
    private cleanup(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.redis && this.isConnected) {
            this.log('[REDIS] Cleaning up connection');
            // Note: Upstash Redis doesn't have explicit close method
            this.redis = null;
            this.isConnected = false;
        }
    }

    /**
     * Get operation metrics
     */
    getMetrics(): {
        totalOperations: number;
        successfulOperations: number;
        failedOperations: number;
        successRate: number;
        avgResponseTime: number;
        lastOperationTime: number;
    } {
        const successRate = this.operationMetrics.totalOperations > 0 ?
            (this.operationMetrics.successfulOperations / this.operationMetrics.totalOperations) * 100 : 0;

        return {
            ...this.operationMetrics,
            successRate: Math.round(successRate * 100) / 100 // Round to 2 decimal places
        };
    }

    /**
     * Additional Redis operations for completeness
     */
    async exists(key: string): Promise<boolean> {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const result = await this.redis!.exists(key);
            return result === 1;
        } catch (error) {
            this.recordFailure();
            return false;
        }
    }

    async ttl(key: string): Promise<number> {
        if (!this.isAvailable()) {
            return -1;
        }

        try {
            const result = await this.redis!.ttl(key);
            return typeof result === 'number' ? result : -1;
        } catch (error) {
            this.recordFailure();
            return -1;
        }
    }

    async keys(pattern: string): Promise<string[]> {
        if (!this.isAvailable()) {
            return [];
        }

        try {
            const result = await this.redis!.keys(pattern);
            return Array.isArray(result) ? result : [];
        } catch (error) {
            this.recordFailure();
            return [];
        }
    }
}

// Singleton instance for easy usage
let redisInstance: ResilientRedis | null = null;

export function getRedisClient(): ResilientRedis {
    if (!redisInstance) {
        redisInstance = new ResilientRedis();
    }
    return redisInstance;
}

// Default export for convenience
export const redis = getRedisClient();
