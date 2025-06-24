/**
 * 🔷 EZ Cache Types & Interfaces
 * 
 * All TypeScript interfaces and types for the cache system
 */

// Performance metrics interface
export interface MetricsData {
    hits: number;
    misses: number;
    errors: number;
    totalRequests: number;
    avgResponseTime: number;
    lastReset: number;
}

// Enhanced memory cache item
export interface CacheItem {
    data: unknown;
    expires: number;
    lastAccess: number;
    hitCount: number;
    size: number; // Approximate size in bytes
    createdAt: number;
}

// Traffic tracking data
export interface TrafficData {
    timestamps: number[];
    lastCleanup: number;
    totalRequests: number;
}

// Redis connection status
export interface RedisStatus {
    available: boolean;
    connected: boolean;
    circuitOpen: boolean;
    failures: number;
    lastFailure: number;
    mode: 'unavailable' | 'connected' | 'disconnected' | 'circuit-open';
}

// Cache statistics interfaces
export interface MemoryStats {
    size: number;
    maxSize: number;
    totalSizeKB: number;
    utilization: number;
    expiredItems: number;
    avgHitCount: number;
    oldestItem: number;
}

export interface TrafficStats {
    endpoints: Record<string, unknown>;
    trackedEndpoints: number;
    trafficThreshold: number;
}

export interface PerformanceStats extends MetricsData {
    hitRate: number;
    errorRate: number;
}

// Cache options for per-item configuration
export interface CacheOptions {
    /** 
     * Time-to-live in seconds (optional, uses config default if not provided)
     * Memory will use this TTL, Redis will automatically use 10x this value
     * @example 300 // Memory: 5min, Redis: 50min
     */
    ttl?: number;

    /** 
     * Minimum traffic count to activate caching for this specific item (optional, uses config default if not provided)
     * Lower values = more aggressive caching, Higher values = more conservative caching
     * @default 100 (production), 20 (test), 3 (development)
     * @example 5 // Cache after 5 requests (aggressive)
     * @example 50 // Cache after 50 requests (balanced)  
     * @example 200 // Cache after 200 requests (conservative)
     */
    minTrafficCount?: number;

    /** 
     * Force caching regardless of traffic (optional, defaults to false)
     * When true, ignores traffic patterns and always uses cache
     * @default false
     * @example true // Always cache (critical system data)
     * @example false // Respect traffic threshold (normal data)
     */
    forceCaching?: boolean;
}

// Simplified cache options - TTL-focused interface
export interface SimpleCacheOptions {
    /** 
     * Time-to-live in seconds (optional, uses config default if not provided)
     * Memory will use this TTL, Redis will automatically use 10x this value
     * @example 300 // Memory: 5min, Redis: 50min
     */
    ttl?: number;

    /** 
     * Minimum traffic count to activate caching (optional, uses smart defaults)
     * @default Auto-calculated based on TTL: Short TTL = Lower threshold, Long TTL = Higher threshold
     * @example 5 // For hot data (TTL < 60s)
     * @example 25 // For warm data (TTL 60-600s)  
     * @example 100 // For cold data (TTL > 600s)
     */
    minTrafficCount?: number;

    /** 
     * Force caching regardless of traffic (optional)
     * @default false
     */
    forceCaching?: boolean;
}

// Main cache result interface
export interface CacheResult<T> {
    data: T;
    source: 'memory' | 'redis' | 'database';
    responseTime: number;
    isHighTraffic: boolean;
}

// System statistics interface
export interface SystemStats {
    system: {
        environment: string;
        version: string;
        uptime: number;
        cacheStrategy: string;
    };
    memory: MemoryStats & { enabled: boolean };
    redis: RedisStatus & { enabled: boolean; circuitBreakerEnabled: boolean };
    traffic: TrafficStats;
    performance: PerformanceStats | null;
    config: {
        trafficThreshold: number;
        defaultTtl: number;
        memoryTtlMax: number;
        memorySize: number;
        maxValueSize: number;
    };
}
