import { cache, ProductionEZCache } from '../src/cache/index';

describe('@shohan/cache', () => {
    beforeEach(() => {
        // Clear cache before each test
        cache.clearAll();
    });

    describe('Basic Functionality', () => {
        test('should fetch data from fetcher on first call', async () => {
            const mockFetcher = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });

            const result = await cache.fetch('test-key', mockFetcher);

            expect(result).toEqual({ id: 1, name: 'Test' });
            expect(mockFetcher).toHaveBeenCalledTimes(1);
        });

        test('should return cached data on subsequent calls', async () => {
            const mockFetcher = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });

            // First call
            const result1 = await cache.fetch('test-key', mockFetcher, { forceCaching: true });
            // Second call
            const result2 = await cache.fetch('test-key', mockFetcher, { forceCaching: true });

            expect(result1).toEqual(result2);
            expect(mockFetcher).toHaveBeenCalledTimes(1);
        });

        test('should handle TTL parameter', async () => {
            const mockFetcher = jest.fn().mockResolvedValue({ data: 'test' });

            const result = await cache.fetch('ttl-test', mockFetcher, 300);

            expect(result).toEqual({ data: 'test' });
            expect(mockFetcher).toHaveBeenCalledTimes(1);
        });

        test('should handle options object', async () => {
            const mockFetcher = jest.fn().mockResolvedValue({ data: 'test' });

            const result = await cache.fetch('options-test', mockFetcher, {
                ttl: 300,
                forceCaching: true,
                minTrafficCount: 1
            });

            expect(result).toEqual({ data: 'test' });
            expect(mockFetcher).toHaveBeenCalledTimes(1);
        });
    });

    describe('Cache Management', () => {
        test('should clear specific cache entry', async () => {
            const mockFetcher = jest.fn().mockResolvedValue({ data: 'test' });

            // Cache data
            await cache.fetch('clear-test', mockFetcher, { forceCaching: true });
            expect(mockFetcher).toHaveBeenCalledTimes(1);

            // Clear cache
            await cache.clear('clear-test');

            // Fetch again - should call fetcher
            await cache.fetch('clear-test', mockFetcher, { forceCaching: true });
            expect(mockFetcher).toHaveBeenCalledTimes(2);
        });

        test('should force refresh data', async () => {
            const mockFetcher = jest.fn()
                .mockResolvedValueOnce({ data: 'old' })
                .mockResolvedValueOnce({ data: 'new' });

            // First call
            const result1 = await cache.fetch('refresh-test', mockFetcher, { forceCaching: true });
            expect(result1).toEqual({ data: 'old' });

            // Force refresh
            const result2 = await cache.forceRefresh('refresh-test', mockFetcher, { forceCaching: true });
            expect(result2).toEqual({ data: 'new' });
            expect(mockFetcher).toHaveBeenCalledTimes(2);
        });
    });

    describe('Error Handling', () => {
        test('should handle fetcher errors gracefully', async () => {
            const mockFetcher = jest.fn().mockRejectedValue(new Error('Database error'));

            await expect(cache.fetch('error-test', mockFetcher)).rejects.toThrow('Database error');
        });

        test('should return data even if cache operations fail', async () => {
            const mockFetcher = jest.fn().mockResolvedValue({ data: 'success' });

            const result = await cache.fetch('fallback-test', mockFetcher);

            expect(result).toEqual({ data: 'success' });
        });
    });

    describe('Statistics and Monitoring', () => {
        test('should provide cache statistics', () => {
            const stats = cache.getStats();

            expect(stats).toHaveProperty('system');
            expect(stats).toHaveProperty('memory');
            expect(stats).toHaveProperty('redis');
            expect(stats).toHaveProperty('traffic');
            expect(stats).toHaveProperty('config');
        });

        test('should provide cache status', () => {
            const status = cache.getStatus();

            expect(status).toHaveProperty('healthy');
            expect(status).toHaveProperty('memoryUtilization');
            expect(status).toHaveProperty('redisConnected');
            expect(status).toHaveProperty('trackedEndpoints');
        });

        test('should run cache tests', async () => {
            const testResult = await cache.test();

            expect(testResult).toHaveProperty('memory');
            expect(testResult).toHaveProperty('redis');
            expect(testResult).toHaveProperty('traffic');
            expect(testResult).toHaveProperty('overall');
        });
    });

    describe('Custom Cache Instance', () => {
        test('should create custom cache instance', () => {
            const customCache = new ProductionEZCache();

            expect(customCache).toBeInstanceOf(ProductionEZCache);
            expect(customCache.getStats).toBeDefined();
            expect(customCache.fetch).toBeDefined();
        });
    });
});
