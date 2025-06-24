/**
 * 🧠 Production Memory Cache
 * 
 * LRU cache with smart eviction, size tracking, and automatic cleanup
 */

import { CACHE_CONFIG } from './config';
import type { CacheItem, MemoryStats } from './types';

export class ProductionMemoryCache {
    private cache = new Map<string, CacheItem>();
    private totalSize = 0;
    private lastCleanup = Date.now();

    /**
     * Store data in memory cache
     * @param key - Cache key
     * @param data - Data to cache
     * @param ttlSeconds - Time to live in seconds
     * @returns Success status
     */
    set(key: string, data: unknown, ttlSeconds: number): boolean {
        try {
            // Estimate data size
            const dataSize = this.estimateSize(data);

            // Skip if data is too large
            if (dataSize > CACHE_CONFIG.MAX_VALUE_SIZE) {
                return false;
            }

            // Cleanup expired items first
            this.cleanupExpired();

            // Make room if needed
            while (this.cache.size >= CACHE_CONFIG.MEMORY_SIZE) {
                if (!this.evictLRU()) break;
            }

            // Store new item
            const item: CacheItem = {
                data,
                expires: Date.now() + (Math.min(ttlSeconds, CACHE_CONFIG.MEMORY_TTL_MAX) * 1000),
                lastAccess: Date.now(),
                hitCount: 1,
                size: dataSize,
                createdAt: Date.now()
            };

            // Remove old item if exists
            const existingItem = this.cache.get(key);
            if (existingItem) {
                this.totalSize -= existingItem.size;
            }

            this.cache.set(key, item);
            this.totalSize += dataSize;

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get data from memory cache
     * @param key - Cache key
     * @returns Cached data or null
     */
    get<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        const now = Date.now();

        // Check expiry
        if (now > item.expires) {
            this.delete(key);
            return null;
        }

        // Update access stats
        item.lastAccess = now;
        item.hitCount++;

        return item.data as T;
    }

    /**
     * Delete specific cache entry
     * @param key - Cache key
     * @returns Success status
     */
    delete(key: string): boolean {
        const item = this.cache.get(key);
        if (item) {
            this.totalSize -= item.size;
            return this.cache.delete(key);
        }
        return false;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.totalSize = 0;
    }

    /**
     * Get current cache size
     */
    size(): number {
        return this.cache.size;
    }

    /**
     * Smart LRU eviction based on multiple factors
     * @returns Success status
     */
    private evictLRU(): boolean {
        if (this.cache.size === 0) return false;

        let evictKey = '';
        let lowestScore = Number.MAX_SAFE_INTEGER;
        const now = Date.now();

        for (const [key, item] of this.cache.entries()) {
            // Scoring algorithm: lower score = more likely to evict
            // Factors: age, access frequency, last access time, size
            const age = now - item.createdAt;
            const timeSinceAccess = now - item.lastAccess;
            const accessFrequency = item.hitCount;
            const sizePenalty = item.size / 1024; // Size in KB

            const score = (timeSinceAccess / 1000) + (age / 10000) + sizePenalty - (accessFrequency * 100);

            if (score < lowestScore) {
                lowestScore = score;
                evictKey = key;
            }
        }

        if (evictKey) {
            this.delete(evictKey);
            return true;
        }

        return false;
    }

    /**
     * Cleanup expired items
     */
    private cleanupExpired(): void {
        const now = Date.now();

        // Throttle cleanup to avoid performance impact
        if (now - this.lastCleanup < 10000) return; // Max once per 10 seconds

        const expiredKeys: string[] = [];

        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => this.delete(key));
        this.lastCleanup = now;
    }

    /**
     * Estimate data size in bytes
     * @param data - Data to estimate
     * @returns Size in bytes
     */
    private estimateSize(data: unknown): number {
        try {
            return JSON.stringify(data).length * 2; // Rough UTF-16 estimate
        } catch {
            return 1024; // Default 1KB if can't stringify
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): MemoryStats {
        const now = Date.now();
        const items = Array.from(this.cache.values());

        return {
            size: this.cache.size,
            maxSize: CACHE_CONFIG.MEMORY_SIZE,
            totalSizeKB: Math.round(this.totalSize / 1024),
            utilization: Math.round((this.cache.size / CACHE_CONFIG.MEMORY_SIZE) * 100),
            expiredItems: items.filter(item => now > item.expires).length,
            avgHitCount: items.length > 0 ?
                Math.round(items.reduce((sum, item) => sum + item.hitCount, 0) / items.length) : 0,
            oldestItem: items.length > 0 ?
                Math.round((now - Math.min(...items.map(item => item.createdAt))) / 1000) : 0
        };
    }
}
