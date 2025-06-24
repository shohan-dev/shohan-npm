/**
 * 📈 Performance Metrics Tracker
 * 
 * Tracks cache performance metrics including hit rates and response times
 */

import { CACHE_CONFIG } from './config';
import type { MetricsData, PerformanceStats } from './types';

export class PerformanceMetrics {
    private metrics: MetricsData = {
        hits: 0,
        misses: 0,
        errors: 0,
        totalRequests: 0,
        avgResponseTime: 0,
        lastReset: Date.now()
    };

    private responseTimes: number[] = [];

    /**
     * Record a cache hit
     * @param responseTime - Response time in milliseconds
     */
    recordHit(responseTime: number): void {
        if (!CACHE_CONFIG.ENABLE_METRICS) return;

        this.metrics.hits++;
        this.metrics.totalRequests++;
        this.recordResponseTime(responseTime);
    }

    /**
     * Record a cache miss
     * @param responseTime - Response time in milliseconds
     */
    recordMiss(responseTime: number): void {
        if (!CACHE_CONFIG.ENABLE_METRICS) return;

        this.metrics.misses++;
        this.metrics.totalRequests++;
        this.recordResponseTime(responseTime);
    }

    /**
     * Record an error
     */
    recordError(): void {
        if (!CACHE_CONFIG.ENABLE_METRICS) return;

        this.metrics.errors++;
        this.metrics.totalRequests++;
    }

    /**
     * Record response time and update average
     * @param time - Response time in milliseconds
     */
    private recordResponseTime(time: number): void {
        this.responseTimes.push(time);

        // Keep only last 1000 response times to prevent memory bloat
        if (this.responseTimes.length > 1000) {
            this.responseTimes = this.responseTimes.slice(-1000);
        }

        // Update rolling average
        this.metrics.avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    }

    /**
     * Get comprehensive performance statistics
     */
    getStats(): PerformanceStats {
        const hitRate = this.metrics.totalRequests > 0 ?
            Math.round((this.metrics.hits / this.metrics.totalRequests) * 100) : 0;

        const errorRate = this.metrics.totalRequests > 0 ?
            Math.round((this.metrics.errors / this.metrics.totalRequests) * 100) : 0;

        return {
            ...this.metrics,
            hitRate,
            errorRate,
            avgResponseTime: Math.round(this.metrics.avgResponseTime * 100) / 100
        };
    }

    /**
     * Get detailed response time statistics
     */
    getResponseTimeStats(): {
        min: number;
        max: number;
        median: number;
        p95: number;
        p99: number;
    } {
        if (this.responseTimes.length === 0) {
            return { min: 0, max: 0, median: 0, p95: 0, p99: 0 };
        }

        const sorted = [...this.responseTimes].sort((a, b) => a - b);
        const len = sorted.length;

        return {
            min: sorted[0],
            max: sorted[len - 1],
            median: sorted[Math.floor(len / 2)],
            p95: sorted[Math.floor(len * 0.95)],
            p99: sorted[Math.floor(len * 0.99)]
        };
    }

    /**
     * Reset all metrics
     */
    reset(): void {
        this.metrics = {
            hits: 0,
            misses: 0,
            errors: 0,
            totalRequests: 0,
            avgResponseTime: 0,
            lastReset: Date.now()
        };
        this.responseTimes = [];
    }

    /**
     * Get cache efficiency score (0-100)
     */
    getEfficiencyScore(): number {
        if (this.metrics.totalRequests === 0) return 0;

        const hitRate = (this.metrics.hits / this.metrics.totalRequests) * 100;
        const errorRate = (this.metrics.errors / this.metrics.totalRequests) * 100;
        const responseTimeScore = Math.max(0, 100 - (this.metrics.avgResponseTime / 10)); // Lower is better

        // Weighted score: 60% hit rate, 30% low error rate, 10% response time
        return Math.round(
            (hitRate * 0.6) +
            ((100 - errorRate) * 0.3) +
            (responseTimeScore * 0.1)
        );
    }

    /**
     * Check if metrics collection is enabled
     */
    isEnabled(): boolean {
        return CACHE_CONFIG.ENABLE_METRICS;
    }
}
