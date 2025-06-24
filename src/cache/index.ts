/**
 * 🚀 Shohan Cache Module - Production-Grade Smart Cache System
 * 
 * A sophisticated 3-layer cache architecture (Memory → Redis → Database) with:
 * - Intelligent traffic detection (caches only when beneficial)
 * - Smart TTL management (Redis gets 10x memory TTL)
 * - Zero-configuration setup with graceful fallbacks
 * - TypeScript-first API with intelligent defaults
 * - Circuit breaker for Redis failures
 * - Comprehensive metrics and monitoring
 * 
 * @author Md Sabbir Roshid Shohan <shohan.dev.cse@gmail.com>
 * @version 1.0.0
 * 
 * Usage:
 * ```typescript
 * import { cache } from 'shohan/cache';
 * 
 * // Simple usage - Replace your DB calls with cache
 * const products = await cache.fetch('products', async () => {
 *   return [{ id: 1, name: 'Product 1' }]; // Your data fetching logic
 * });
 * 
 * // With TTL
 * const users = await cache.fetch('users', async () => {
 *   return [{ id: 1, name: 'User 1' }];
 * }, 300);
 * 
 * // Advanced configuration
 * const posts = await cache.fetch('posts', async () => {
 *   return [{ id: 1, title: 'Post 1' }];
 * }, {
 *   ttl: 300,
 *   minTrafficCount: 50,
 *   forceCaching: false
 * });
 * ```
 */

import { ProductionEZCache } from './ezCache';

// Create and export the production-grade cache instance
export const cache = new ProductionEZCache();

// Named exports for advanced usage
export { ProductionEZCache } from './ezCache';
export { CACHE_CONFIG } from './config';
export type {
    SystemStats,
    MemoryStats,
    TrafficStats,
    PerformanceStats,
    RedisStatus,
    CacheResult,
    CacheOptions,
    SimpleCacheOptions,
    CacheItem,
    TrafficData,
    MetricsData
} from './types';

// Re-export individual components for custom implementations
export { ProductionMemoryCache } from './memory';
export { ProductionTrafficTracker } from './traffic';
export { ResilientRedis } from './redis';
export { PerformanceMetrics } from './metrics';

// Default export for convenience
export default cache;
