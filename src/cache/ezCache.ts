/**
 * 🚀 Production EZ Cache - Main Controller
 * 
 * The main cache orchestrator that coordinates all components
 * Supports multiple cache modes: HYBRID, MEMORY_ONLY, REDIS_ONLY, DISABLED
 */

import { CACHE_CONFIG, CONFIG_HELPERS } from './config';
import { ProductionMemoryCache } from './memory';
import { ProductionTrafficTracker } from './traffic';
import { ResilientRedis } from './redis';
import { PerformanceMetrics } from './metrics';
import type { SystemStats, CacheOptions, SimpleCacheOptions } from './types';

export class ProductionEZCache {
    private memory: ProductionMemoryCache | null = null;
    private traffic: ProductionTrafficTracker | null = null;
    private redis: ResilientRedis | null = null;
    private metrics: PerformanceMetrics | null = null;
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        this.log(`🚀 Production EZ Cache v3 starting (${CACHE_CONFIG.ENVIRONMENT})...`);
        this.log(`📋 Cache Mode: ${CACHE_CONFIG.CACHE_MODE}`);
        this.log(`🎯 Strategy: ${CACHE_CONFIG.CACHE_STRATEGY}`);

        // Initialize components based on configuration
        this.initializeComponents();

        // Setup automatic cleanup
        this.setupCleanup();

        // Log configuration
        this.logConfiguration();

        this.log(`✅ Production EZ Cache ready! ${CONFIG_HELPERS.getCacheModeDescription()}`);
    }

    /**
     * Initialize cache components based on configuration
     */
    private initializeComponents(): void {
        // Initialize memory cache if enabled
        if (CACHE_CONFIG.ENABLE_MEMORY) {
            this.memory = new ProductionMemoryCache();
            this.log(`🧠 Memory cache initialized (${CACHE_CONFIG.MEMORY_SIZE} items)`);
        }

        // Initialize Redis if enabled
        if (CACHE_CONFIG.ENABLE_REDIS) {
            this.redis = new ResilientRedis();
            this.log(`💾 Redis client initialized`);
        }

        // Initialize traffic tracker if needed
        if (CACHE_CONFIG.ENABLE_TRAFFIC_DETECTION) {
            this.traffic = new ProductionTrafficTracker();
            this.log(`📊 Traffic tracking enabled`);
        }

        // Initialize metrics if enabled
        if (CACHE_CONFIG.ENABLE_METRICS) {
            this.metrics = new PerformanceMetrics();
            this.log(`📈 Performance metrics enabled`);
        }
    }

    /**
     * Helper function to calculate smart defaults based on TTL
     * Shorter TTL = More aggressive caching (lower traffic threshold)
     * Longer TTL = More conservative caching (higher traffic threshold)
     */
    private getSmartTrafficThreshold(ttl: number): number {
        if (ttl <= 60) {
            // Hot data (≤1 min) - very aggressive caching
            return Math.max(3, Math.floor(CACHE_CONFIG.TRAFFIC_THRESHOLD * 0.1));
        } else if (ttl <= 600) {
            // Warm data (≤10 min) - balanced caching  
            return Math.max(10, Math.floor(CACHE_CONFIG.TRAFFIC_THRESHOLD * 0.3));
        } else {
            // Cold data (>10 min) - conservative caching
            return CACHE_CONFIG.TRAFFIC_THRESHOLD;
        }
    }

    /**
     * 🎯 Main cache method - TTL-focused with smart defaults
     * 
     * Features intelligent defaults and flexible options:
     * - Pass just a number for TTL (gets smart traffic threshold)
     * - Pass an object for full control with TypeScript suggestions
     * - Smart traffic thresholds: Short TTL = aggressive, Long TTL = conservative
     * - Redis TTL automatically set to 10x memory TTL for optimal performance
     * 
     * @param key - Cache key (auto-prefixed)
     * @param fetcher - Function to get data from database
     * @param optionsOrTtl - TTL number (simple) or options object (advanced) - optional
     * @returns Cached or fresh data
     * 
     * @example
     * // Simple TTL (gets smart defaults)
     * await ezCache.fetch('products', fetcher, 300);
     * 
     * @example  
     * // Advanced with suggestions
     * await ezCache.fetch('products', fetcher, {
     *   ttl: 300,              // Memory: 5min, Redis: 50min
     *   minTrafficCount: 50,   // Cache after 50 requests
     *   forceCaching: false    // Respect traffic threshold
     * });
     */
    async fetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        optionsOrTtl?: number | SimpleCacheOptions
    ): Promise<T> {
        const startTime = Date.now();
        const fullKey = `ez:${key}`;

        // Parse options and apply smart defaults
        let cacheOptions: CacheOptions;

        if (typeof optionsOrTtl === 'number') {
            // Legacy number format - TTL only
            cacheOptions = {
                ttl: optionsOrTtl,
                minTrafficCount: this.getSmartTrafficThreshold(optionsOrTtl),
                forceCaching: false
            };
        } else if (optionsOrTtl && typeof optionsOrTtl === 'object') {
            // Object format with options
            const ttlValue = optionsOrTtl.ttl || CACHE_CONFIG.DEFAULT_TTL;
            cacheOptions = {
                ttl: ttlValue,
                minTrafficCount: optionsOrTtl.minTrafficCount ?? this.getSmartTrafficThreshold(ttlValue),
                forceCaching: optionsOrTtl.forceCaching ?? false
            };
        } else {
            // No options provided - use defaults
            cacheOptions = {
                ttl: CACHE_CONFIG.DEFAULT_TTL,
                minTrafficCount: CACHE_CONFIG.TRAFFIC_THRESHOLD,
                forceCaching: false
            };
        }

        // Calculate TTL values - use provided TTL or default
        const memoryTtl = cacheOptions.ttl!;
        const redisTtl = CACHE_CONFIG.ENABLE_REDIS ? memoryTtl * 10 : memoryTtl; // Redis gets 10x TTL for longer backup

        // Get traffic threshold for this specific item
        const itemTrafficThreshold = cacheOptions.minTrafficCount!;

        try {
            // Handle DISABLED mode - direct database access
            if (CACHE_CONFIG.CACHE_MODE === 'DISABLED') {
                this.log(`🚫 Cache disabled - direct database fetch for "${key}"`);
                return await fetcher();
            }

            // Check traffic if traffic detection is enabled (unless forced caching)
            let isHighTraffic: boolean = cacheOptions.forceCaching || true; // Default to caching if forced or no traffic detection
            if (CACHE_CONFIG.ENABLE_TRAFFIC_DETECTION && this.traffic && !cacheOptions.forceCaching) {
                isHighTraffic = this.traffic.isHighTraffic(key, itemTrafficThreshold);

                // Low traffic - fetch directly (no caching overhead)
                if (!isHighTraffic) {
                    this.log(`📊 Low traffic "${key}" (${this.traffic.getCurrentCount(key)}/${itemTrafficThreshold}) - direct database fetch`);
                    const data = await fetcher();

                    if (this.metrics) {
                        this.metrics.recordMiss(Date.now() - startTime);
                    }

                    return data;
                }
            }

            this.log(`🔥 ${isHighTraffic ? 'High traffic' : 'Caching'} "${key}" (${this.traffic?.getCurrentCount(key) || 0}/${itemTrafficThreshold}) - ${CACHE_CONFIG.CACHE_MODE} mode activated`);

            // Try cache layers based on mode
            return await this.fetchFromCacheLayers(fullKey, fetcher, memoryTtl, redisTtl, startTime);

        } catch (error) {
            this.log(`❌ Cache error for "${key}":`, error);

            if (this.metrics) {
                this.metrics.recordError();
            }

            // Always fallback to database
            return await fetcher();
        }
    }

    /**
     * Fetch data from available cache layers with flexible TTL logic
     */
    private async fetchFromCacheLayers<T>(
        fullKey: string,
        fetcher: () => Promise<T>,
        memoryTtl: number,
        redisTtl: number,
        startTime: number
    ): Promise<T> {
        // Layer 1: Memory Cache (if available and enabled)
        if (this.memory && CACHE_CONFIG.ENABLE_MEMORY) {
            const memData = this.memory.get<T>(fullKey);
            if (memData) {
                this.log(`⚡ Memory cache hit: ${fullKey} (~2ms)`);

                if (this.metrics) {
                    this.metrics.recordHit(Date.now() - startTime);
                }

                return memData;
            }
        }

        // Layer 2: Redis Cache (if available and enabled)
        if (this.redis && CACHE_CONFIG.ENABLE_REDIS) {
            const redisData = await this.redis.get(fullKey);
            if (redisData) {
                this.log(`💾 Redis cache hit: ${fullKey} (~25ms)`);

                // Store in memory for next time (if memory is enabled)
                if (this.memory) {
                    this.memory.set(fullKey, redisData, Math.min(memoryTtl, CACHE_CONFIG.MEMORY_TTL_MAX));
                }

                if (this.metrics) {
                    this.metrics.recordHit(Date.now() - startTime);
                }

                return redisData as T;
            }
        }

        // Layer 3: Database (cache miss)
        this.log(`🔍 Cache miss "${fullKey}" - fetching from database (~200ms)`);
        const data = await fetcher();

        // Store in available cache layers
        await this.storeInCacheLayers(fullKey, data, memoryTtl, redisTtl);

        if (this.metrics) {
            this.metrics.recordMiss(Date.now() - startTime);
        }

        return data;
    }

    /**
     * Store data in available cache layers with optimal TTL strategy
     */
    private async storeInCacheLayers(
        fullKey: string,
        data: unknown,
        memoryTtl: number,
        redisTtl: number
    ): Promise<void> {
        const results: string[] = [];

        // Store in memory (if enabled) - use memory TTL
        if (this.memory && CACHE_CONFIG.ENABLE_MEMORY) {
            const memoryStored = this.memory.set(fullKey, data, Math.min(memoryTtl, CACHE_CONFIG.MEMORY_TTL_MAX));
            results.push(`Memory=${memoryStored}/${memoryTtl}s`);
        }

        // Store in Redis (if enabled) - use Redis TTL (10x memory for longer backup)
        if (this.redis && CACHE_CONFIG.ENABLE_REDIS) {
            const redisStored = await this.redis.setex(fullKey, redisTtl, data);
            results.push(`Redis=${redisStored}/${redisTtl}s`);
        }

        if (results.length > 0) {
            this.log(`💾 Cached "${fullKey}": ${results.join(', ')} (Memory: ${memoryTtl}s, Redis: ${redisTtl}s)`);
        }
    }

    /**
     * 🗑️ Clear specific cache entry
     * @param key - Cache key to clear
     */
    async clear(key: string): Promise<void> {
        const fullKey = `ez:${key}`;

        // Clear from memory (if enabled)
        const memoryCleared = this.memory?.delete(fullKey) || false;

        // Clear from Redis (if enabled)  
        const redisCleared = await this.redis?.del(fullKey) || false;

        this.log(`🗑️ Cleared cache "${key}": Memory=${memoryCleared}, Redis=${redisCleared}`);
    }

    /**
     * 🧹 Clear all cache
     */
    async clearAll(): Promise<void> {
        this.memory?.clear();
        this.traffic?.clear();
        this.log(`🧹 All caches cleared`);
    }

    /**
     * 🔄 Force refresh - get fresh data and update cache
     * @param key - Cache key
     * @param fetcher - Function to get fresh data
     * @param optionsOrTtl - TTL number or options object (optional)
     */
    async forceRefresh<T>(
        key: string,
        fetcher: () => Promise<T>,
        optionsOrTtl?: number | SimpleCacheOptions
    ): Promise<T> {
        await this.clear(key);
        return this.fetch(key, fetcher, optionsOrTtl);
    }

    /**
     * 📊 Get comprehensive system statistics
     */
    getStats(): SystemStats {
        const memoryStats = this.memory?.getStats() || {
            size: 0, maxSize: 0, totalSizeKB: 0, utilization: 0,
            expiredItems: 0, avgHitCount: 0, oldestItem: 0
        };
        const trafficStats = this.traffic?.getStats() || {
            endpoints: {}, trackedEndpoints: 0, trafficThreshold: 0
        };
        const redisStatus = this.redis?.getConnectionStatus() || {
            available: false, connected: false, circuitOpen: false,
            failures: 0, lastFailure: 0, mode: 'unavailable' as const
        };
        const metricsStats = (CACHE_CONFIG.ENABLE_METRICS && this.metrics) ? this.metrics.getStats() : null;

        return {
            system: {
                environment: CACHE_CONFIG.ENVIRONMENT,
                version: '3.0.0',
                uptime: Date.now() - (metricsStats?.lastReset || Date.now()),
                cacheStrategy: CONFIG_HELPERS.getCacheModeDescription()
            },
            memory: {
                ...memoryStats,
                enabled: CACHE_CONFIG.ENABLE_MEMORY
            },
            redis: {
                ...redisStatus,
                enabled: CACHE_CONFIG.ENABLE_REDIS,
                circuitBreakerEnabled: CACHE_CONFIG.ENABLE_CIRCUIT_BREAKER
            },
            traffic: trafficStats,
            performance: metricsStats,
            config: {
                trafficThreshold: CACHE_CONFIG.TRAFFIC_THRESHOLD,
                defaultTtl: CACHE_CONFIG.DEFAULT_TTL,
                memoryTtlMax: CACHE_CONFIG.MEMORY_TTL_MAX,
                memorySize: CACHE_CONFIG.MEMORY_SIZE,
                maxValueSize: CACHE_CONFIG.MAX_VALUE_SIZE
            }
        };
    }

    /**
     * 🎯 Get simple cache status
     */
    getStatus(): {
        healthy: boolean;
        memoryUtilization: number;
        redisConnected: boolean;
        trackedEndpoints: number;
        efficiencyScore?: number;
    } {
        const stats = this.getStats();

        return {
            healthy: stats.redis.connected || stats.memory.enabled,
            memoryUtilization: stats.memory.utilization,
            redisConnected: stats.redis.connected,
            trackedEndpoints: stats.traffic.trackedEndpoints,
            efficiencyScore: stats.performance && this.metrics ? this.metrics.getEfficiencyScore() : undefined
        };
    }

    /**
     * 🧪 Test cache functionality
     */
    async test(): Promise<{
        memory: boolean;
        redis: boolean;
        traffic: boolean;
        overall: boolean;
    }> {
        const testKey = 'ez:test:' + Date.now();
        const testData = { test: true, timestamp: Date.now() };

        try {
            // Test memory
            const memoryTest = this.memory?.set(testKey, testData, 60) || false;
            const memoryGet = this.memory?.get(testKey) || null;
            const memoryWorks = memoryTest && !!memoryGet;

            // Test Redis
            const redisSet = await this.redis?.setex(testKey, 60, testData) || false;
            const redisGet = await this.redis?.get(testKey) || null;
            const redisWorks = redisSet && !!redisGet;

            // Test traffic
            const trafficCount = this.traffic?.track('test') || 0;
            const trafficWorks = trafficCount > 0;

            // Cleanup
            this.memory?.delete(testKey);
            await this.redis?.del(testKey);

            const overall = memoryWorks && (redisWorks || !CACHE_CONFIG.ENABLE_REDIS) && trafficWorks;

            return {
                memory: memoryWorks,
                redis: redisWorks,
                traffic: trafficWorks,
                overall
            };

        } catch {
            return {
                memory: false,
                redis: false,
                traffic: false,
                overall: false
            };
        }
    }

    /**
     * 🔧 Setup automatic cleanup processes
     */
    private setupCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.cleanupInterval = setInterval(() => {
            this.log(`🧹 Running periodic cleanup...`);
            // The individual components handle their own cleanup
        }, CACHE_CONFIG.CLEANUP_INTERVAL);

        // Cleanup on process exit
        process.on('exit', () => {
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
            }
        });
    }

    /**
     * 📝 Log current configuration
     */
    private logConfiguration(): void {
        this.log(`📊 Traffic threshold: ${CACHE_CONFIG.TRAFFIC_THRESHOLD} req/min`);
        this.log(`⏱️ Default TTL: ${CACHE_CONFIG.DEFAULT_TTL}s`);
        this.log(`🧠 Memory size: ${CACHE_CONFIG.MEMORY_SIZE} items`);
        this.log(`💾 Redis: ${CACHE_CONFIG.ENABLE_REDIS ? 'enabled' : 'disabled'}`);
        this.log(`🔧 Circuit breaker: ${CACHE_CONFIG.ENABLE_CIRCUIT_BREAKER ? 'enabled' : 'disabled'}`);
        this.log(`📈 Metrics: ${CACHE_CONFIG.ENABLE_METRICS ? 'enabled' : 'disabled'}`);
    }

    /**
     * 📝 Internal logging method
     */
    private log(message: string, ...args: unknown[]): void {
        if (CACHE_CONFIG.ENABLE_LOGGING) {
            console.log(`[PROD-EZ-CACHE] ${message}`, ...args);
        }
    }
}
