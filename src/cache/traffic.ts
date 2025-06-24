/**
 * 📊 Production Traffic Tracker
 * 
 * Tracks API request patterns with memory leak prevention and automatic cleanup
 */

import { CACHE_CONFIG } from './config';
import type { TrafficData, TrafficStats } from './types';

export class ProductionTrafficTracker {
    private requests = new Map<string, TrafficData>();
    private lastGlobalCleanup = Date.now();

    /**
     * Track a request and return current count
     * @param key - Endpoint identifier
     * @returns Current request count in window
     */
    track(key: string): number {
        const now = Date.now();

        // Get or create tracking data
        let data = this.requests.get(key);
        if (!data) {
            data = {
                timestamps: [],
                lastCleanup: now,
                totalRequests: 0
            };
            this.requests.set(key, data);
        }

        // Periodic cleanup to prevent memory leaks
        if (now - data.lastCleanup > CACHE_CONFIG.TRACKER_CLEANUP_MS) {
            this.cleanupEndpoint(key, data);
            data.lastCleanup = now;
        }

        // Global cleanup periodically
        if (now - this.lastGlobalCleanup > CACHE_CONFIG.TRACKER_CLEANUP_MS * 2) {
            this.globalCleanup();
            this.lastGlobalCleanup = now;
        }

        // Filter valid requests within window
        data.timestamps = data.timestamps.filter(time =>
            now - time < CACHE_CONFIG.WINDOW_MS
        );

        // Add current request
        data.timestamps.push(now);
        data.totalRequests++;

        return data.timestamps.length;
    }

    /**
     * Check if endpoint has high traffic
     * @param key - Endpoint identifier
     * @param customThreshold - Custom traffic threshold (optional, uses config default)
     * @returns True if high traffic detected
     */
    isHighTraffic(key: string, customThreshold?: number): boolean {
        const count = this.track(key);
        const threshold = customThreshold || CACHE_CONFIG.TRAFFIC_THRESHOLD;
        return count >= threshold;
    }

    /**
     * Get current request count for endpoint
     * @param key - Endpoint identifier
     * @returns Current request count
     */
    getCurrentCount(key: string): number {
        const data = this.requests.get(key);
        if (!data) return 0;

        const now = Date.now();
        const validRequests = data.timestamps.filter(time =>
            now - time < CACHE_CONFIG.WINDOW_MS
        );

        return validRequests.length;
    }

    /**
     * Clean up old timestamps for specific endpoint
     * @param key - Endpoint identifier
     * @param data - Traffic data to clean
     */
    private cleanupEndpoint(key: string, data: TrafficData): void {
        const now = Date.now();
        data.timestamps = data.timestamps.filter(time =>
            now - time < CACHE_CONFIG.WINDOW_MS
        );
    }

    /**
     * Global cleanup of inactive endpoints
     */
    private globalCleanup(): void {
        const now = Date.now();
        const inactiveKeys: string[] = [];

        for (const [key, data] of this.requests.entries()) {
            // Remove endpoints with no recent activity
            if (data.timestamps.length === 0 ||
                (data.timestamps.length > 0 && now - data.timestamps[data.timestamps.length - 1] > CACHE_CONFIG.TRACKER_CLEANUP_MS)) {
                inactiveKeys.push(key);
            }
        }

        inactiveKeys.forEach(key => this.requests.delete(key));
    }

    /**
     * Get comprehensive traffic statistics
     */
    getStats(): TrafficStats {
        const now = Date.now();
        const stats: Record<string, unknown> = {};

        for (const [key, data] of this.requests.entries()) {
            const recentRequests = data.timestamps.filter(time =>
                now - time < CACHE_CONFIG.WINDOW_MS
            );

            stats[key] = {
                currentRequests: recentRequests.length,
                totalRequests: data.totalRequests,
                isHighTraffic: recentRequests.length >= CACHE_CONFIG.TRAFFIC_THRESHOLD,
                lastActivity: data.timestamps.length > 0 ?
                    new Date(data.timestamps[data.timestamps.length - 1]).toISOString() : null
            };
        }

        return {
            endpoints: stats,
            trackedEndpoints: this.requests.size,
            trafficThreshold: CACHE_CONFIG.TRAFFIC_THRESHOLD
        };
    }

    /**
     * Clear all traffic data
     */
    clear(): void {
        this.requests.clear();
        this.lastGlobalCleanup = Date.now();
    }

    /**
     * Get number of tracked endpoints
     */
    getTrackedEndpointsCount(): number {
        return this.requests.size;
    }
}
