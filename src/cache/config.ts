/**
 * 🔧 EZ Cache Configuration - Production Grade
 * 
 * Flexible configuration that handles all scenarios:
 * - With Redis (full 3-layer: Memory → Redis → DB)
 * - Without Redis (2-layer: Memory → DB) 
 * - Memory-only mode
 * - Configurable logging, metrics, traffic detection
 */

// Auto-detect environment
const ENV = process.env.NODE_ENV || 'production';
const IS_DEV = ENV === 'development';
const IS_PROD = ENV === 'production';
const IS_TEST = ENV === 'test';

// User configurable options via environment variables
interface UserCacheConfig {
    // Redis Configuration (completely optional)
    enableRedis?: boolean;
    redisUrl?: string;
    redisToken?: string;

    // Memory Configuration
    enableMemory?: boolean;
    memorySize?: number;

    // Feature toggles
    enableLogging?: boolean;
    enableMetrics?: boolean;
    enableTrafficDetection?: boolean;
    enableCircuitBreaker?: boolean;

    // Performance tuning
    trafficThreshold?: number;
    defaultTtl?: number;
    cleanupInterval?: number;

    // Cache strategy
    cacheStrategy?: 'aggressive' | 'balanced' | 'conservative' | 'memory-only' | 'custom';
}

// Check if Redis dependencies are available (graceful fallback if @upstash/redis is not installed)
function checkRedisAvailability(): boolean {
    try {
        // Check if Redis package is available
        require.resolve('@upstash/redis');

        // Check if Redis environment variables are provided
        const hasRedisUrl = !!process.env.UPSTASH_REDIS_REST_URL;
        const hasRedisToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;

        // Check user preference (can disable Redis even if available)
        const userDisabled = process.env.CACHE_DISABLE_REDIS === 'true';

        return hasRedisUrl && hasRedisToken && !userDisabled;
    } catch {
        // @upstash/redis package not installed - graceful fallback
        return false;
    }
}

// Smart defaults based on environment and availability
function getSmartDefaults(): Required<UserCacheConfig> {
    const redisAvailable = checkRedisAvailability();

    return {
        // Redis settings (auto-detect but allow override)
        enableRedis: redisAvailable && (process.env.CACHE_ENABLE_REDIS !== 'false'),
        redisUrl: process.env.UPSTASH_REDIS_REST_URL || '',
        redisToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',

        // Memory settings
        enableMemory: process.env.CACHE_ENABLE_MEMORY !== 'false', // Default true
        memorySize: IS_DEV ? 200 : IS_PROD ? 5000 : 1000,

        // Feature flags with smart defaults
        enableLogging: process.env.CACHE_ENABLE_LOGGING === 'true' || IS_DEV,
        enableMetrics: process.env.CACHE_ENABLE_METRICS !== 'false' && (IS_PROD || IS_TEST),
        enableTrafficDetection: process.env.CACHE_ENABLE_TRAFFIC !== 'false',
        enableCircuitBreaker: process.env.CACHE_ENABLE_CIRCUIT_BREAKER !== 'false' && redisAvailable,

        // Performance settings
        trafficThreshold: IS_DEV ? 3 : IS_PROD ? 100 : 20,
        defaultTtl: IS_DEV ? 60 : IS_PROD ? 600 : 180,
        cleanupInterval: IS_DEV ? 2 * 60 * 1000 : IS_PROD ? 10 * 60 * 1000 : 5 * 60 * 1000,

        // Cache strategy
        cacheStrategy: (process.env.CACHE_STRATEGY as 'aggressive' | 'balanced' | 'conservative' | 'memory-only' | 'custom') ||
            (IS_PROD ? 'balanced' : IS_DEV ? 'aggressive' : 'conservative')
    };
}

// Apply strategy-based configurations
function applyCacheStrategy(config: Required<UserCacheConfig>): Required<UserCacheConfig> {
    switch (config.cacheStrategy) {
        case 'aggressive':
            return {
                ...config,
                trafficThreshold: 1, // Cache almost everything
                defaultTtl: IS_PROD ? 900 : 300, // Longer TTL
                memorySize: config.memorySize * 1.5,
                enableMetrics: true
            };

        case 'conservative':
            return {
                ...config,
                trafficThreshold: IS_PROD ? 200 : 50, // Cache only high traffic
                defaultTtl: IS_PROD ? 300 : 60, // Shorter TTL
                memorySize: Math.floor(config.memorySize * 0.7),
                enableMetrics: IS_PROD
            };

        case 'memory-only':
            return {
                ...config,
                enableRedis: false, // Force disable Redis
                memorySize: config.memorySize * 2, // Larger memory
                trafficThreshold: 5 // Lower threshold since no Redis
            };

        case 'balanced':
        default:
            return config; // Use defaults
    }
}

// Build final configuration
const userConfig = getSmartDefaults();
const finalConfig = applyCacheStrategy(userConfig);

export const CACHE_CONFIG = {
    // Environment info
    ENVIRONMENT: ENV,
    IS_DEV,
    IS_PROD,
    IS_TEST,

    // Cache layers configuration
    ENABLE_MEMORY: finalConfig.enableMemory,
    ENABLE_REDIS: finalConfig.enableRedis,

    // Redis settings (safe even if Redis not available)
    REDIS_URL: finalConfig.redisUrl,
    REDIS_TOKEN: finalConfig.redisToken,
    REDIS_TIMEOUT: parseInt(process.env.CACHE_REDIS_TIMEOUT || '5000'),
    REDIS_RETRY_ATTEMPTS: parseInt(process.env.CACHE_REDIS_RETRIES || '3'),

    // Circuit breaker settings
    ENABLE_CIRCUIT_BREAKER: finalConfig.enableCircuitBreaker,
    CIRCUIT_FAILURE_THRESHOLD: parseInt(process.env.CACHE_CIRCUIT_THRESHOLD || '3'),
    CIRCUIT_RESET_TIMEOUT: parseInt(process.env.CACHE_CIRCUIT_RESET || '30000'),

    // Memory settings
    MEMORY_SIZE: finalConfig.memorySize,
    MEMORY_TTL_MAX: IS_DEV ? 120 : IS_PROD ? 300 : 180,

    // Traffic and performance
    TRAFFIC_THRESHOLD: finalConfig.trafficThreshold,
    DEFAULT_TTL: finalConfig.defaultTtl,
    CLEANUP_INTERVAL: finalConfig.cleanupInterval,

    // Feature flags
    ENABLE_LOGGING: finalConfig.enableLogging,
    ENABLE_METRICS: finalConfig.enableMetrics,
    ENABLE_TRAFFIC_DETECTION: finalConfig.enableTrafficDetection,

    // Performance limits
    MAX_VALUE_SIZE: parseInt(process.env.CACHE_MAX_VALUE_SIZE || '1048576'), // 1MB
    WINDOW_MS: parseInt(process.env.CACHE_WINDOW_MS || '60000'), // 1 minute
    TRACKER_CLEANUP_MS: parseInt(process.env.CACHE_TRACKER_CLEANUP || '300000'), // 5 minutes

    // Cache strategy info
    CACHE_STRATEGY: finalConfig.cacheStrategy,

    // Cache mode based on what's enabled
    CACHE_MODE: finalConfig.enableRedis && finalConfig.enableMemory ? 'HYBRID' :
        finalConfig.enableMemory && !finalConfig.enableRedis ? 'MEMORY_ONLY' :
            !finalConfig.enableMemory && finalConfig.enableRedis ? 'REDIS_ONLY' :
                'DISABLED'
} as const;

// Export types for other modules
export type CacheConfig = typeof CACHE_CONFIG;
export type CacheMode = typeof CACHE_CONFIG.CACHE_MODE;
export type CacheStrategy = Required<UserCacheConfig>['cacheStrategy'];

// Helper functions for configuration
export const CONFIG_HELPERS = {
    /**
     * Check if Redis is available and enabled
     */
    isRedisEnabled(): boolean {
        return CACHE_CONFIG.ENABLE_REDIS && !!CACHE_CONFIG.REDIS_URL;
    },

    /**
     * Check if memory cache is enabled
     */
    isMemoryEnabled(): boolean {
        return CACHE_CONFIG.ENABLE_MEMORY;
    },

    /**
     * Get current cache mode description
     */
    getCacheModeDescription(): string {
        switch (CACHE_CONFIG.CACHE_MODE) {
            case 'HYBRID':
                return 'Full 3-layer caching: Memory → Redis → Database';
            case 'MEMORY_ONLY':
                return '2-layer caching: Memory → Database (Redis disabled/unavailable)';
            case 'REDIS_ONLY':
                return '2-layer caching: Redis → Database (Memory disabled)';
            case 'DISABLED':
                return 'Direct database access (All caching disabled)';
            default:
                return 'Unknown cache mode';
        }
    },

    /**
     * Get configuration summary for logging
     */
    getConfigSummary() {
        return {
            mode: CACHE_CONFIG.CACHE_MODE,
            strategy: CACHE_CONFIG.CACHE_STRATEGY,
            environment: CACHE_CONFIG.ENVIRONMENT,
            redisEnabled: this.isRedisEnabled(),
            memoryEnabled: this.isMemoryEnabled(),
            loggingEnabled: CACHE_CONFIG.ENABLE_LOGGING,
            metricsEnabled: CACHE_CONFIG.ENABLE_METRICS,
            trafficDetection: CACHE_CONFIG.ENABLE_TRAFFIC_DETECTION,
            trafficThreshold: CACHE_CONFIG.TRAFFIC_THRESHOLD,
            defaultTtl: CACHE_CONFIG.DEFAULT_TTL,
            memorySize: CACHE_CONFIG.MEMORY_SIZE
        };
    }
};

/**
 * 📚 CONFIGURATION GUIDE
 * 
 * Environment Variables for customization:
 * 
 * === Redis Configuration ===
 * UPSTASH_REDIS_REST_URL=your_redis_url          # Redis URL (if available)
 * UPSTASH_REDIS_REST_TOKEN=your_redis_token      # Redis token (if available)
 * CACHE_ENABLE_REDIS=true|false                  # Force enable/disable Redis
 * CACHE_DISABLE_REDIS=true                       # Force disable Redis (overrides enable)
 * CACHE_REDIS_TIMEOUT=5000                       # Redis timeout in ms
 * CACHE_REDIS_RETRIES=3                          # Redis retry attempts
 * 
 * === Memory Configuration ===
 * CACHE_ENABLE_MEMORY=true|false                 # Enable/disable memory cache
 * 
 * === Feature Toggles ===
 * CACHE_ENABLE_LOGGING=true|false                # Enable detailed logging
 * CACHE_ENABLE_METRICS=true|false                # Enable performance metrics
 * CACHE_ENABLE_TRAFFIC=true|false                # Enable traffic detection
 * CACHE_ENABLE_CIRCUIT_BREAKER=true|false        # Enable Redis circuit breaker
 * 
 * === Performance Tuning ===
 * CACHE_STRATEGY=aggressive|balanced|conservative|memory-only  # Cache strategy
 * CACHE_MAX_VALUE_SIZE=1048576                   # Max cache value size (bytes)
 * CACHE_WINDOW_MS=60000                          # Traffic window (ms)
 * CACHE_TRACKER_CLEANUP=300000                   # Tracker cleanup interval (ms)
 * 
 * === Cache Strategies ===
 * - aggressive: Cache almost everything (dev/demo)
 * - balanced: Smart caching based on traffic (production default)
 * - conservative: Cache only high-traffic endpoints
 * - memory-only: Use only memory cache, no Redis
 * 
 * === Cache Modes (Auto-detected) ===
 * - HYBRID: Memory → Redis → Database (best performance)
 * - MEMORY_ONLY: Memory → Database (Redis unavailable/disabled)
 * - REDIS_ONLY: Redis → Database (memory disabled)
 * - DISABLED: Direct database access (all caching disabled)
 * 
 * === Per-Item Cache Options (NEW!) ===
 * 
 * The cache now supports per-item configuration for production-grade control:
 * 
 * // Basic usage (backward compatible)
 * await ezCache.fetch('key', fetcher, 300); // TTL only
 * 
 * // Advanced usage with per-item control
 * await ezCache.fetch('key', fetcher, {
 *   ttl: 300,                    // Memory: 300s, Redis: 3000s (auto 10x)
 *   minTrafficCount: 50,         // Cache after 50 requests/min (overrides global setting)
 *   forceCaching: false          // Respect traffic threshold (true = always cache)
 * });
 * 
 * Examples:
 * - Hot data: { ttl: 30, minTrafficCount: 5, forceCaching: false }
 * - Warm data: { ttl: 300, minTrafficCount: 25, forceCaching: false } 
 * - Cold data: { ttl: 1800, minTrafficCount: 100, forceCaching: false }
 * - Critical data: { ttl: 600, minTrafficCount: 1, forceCaching: true }
 * 
 * This allows you to fine-tune caching behavior per endpoint for optimal performance!
 */

// Export configuration for use in other modules
export default CACHE_CONFIG;
