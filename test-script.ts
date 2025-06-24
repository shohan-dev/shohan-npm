/**
 * 🧪 Test Script for Shohan Cache
 * 
 * This script demonstrates the basic functionality of the cache system
 */

import { cache } from './src/cache/index';

async function testCache() {
    console.log('🚀 Testing Shohan Cache System...\n');

    // Test 1: Basic caching
    console.log('📝 Test 1: Basic caching');
    const products = await cache.fetch('test-products', async () => {
        console.log('  ⏳ Fetching from "database"...');
        await new Promise(resolve => setTimeout(resolve, 100));
        return [
            { id: 1, name: 'Laptop', price: 999 },
            { id: 2, name: 'Phone', price: 599 }
        ];
    });
    console.log('  ✅ Products:', products);

    // Test 2: Cache hit (should be instant)
    console.log('\n📝 Test 2: Cache hit');
    const cachedProducts = await cache.fetch('test-products', async () => {
        console.log('  ⏳ This should not appear (cache hit)');
        return [];
    }, { forceCaching: true });
    console.log('  ✅ Cached Products:', cachedProducts);

    // Test 3: TTL-based caching
    console.log('\n📝 Test 3: TTL-based caching');
    const users = await cache.fetch('test-users', async () => {
        console.log('  ⏳ Fetching users...');
        await new Promise(resolve => setTimeout(resolve, 50));
        return [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ];
    }, 300); // 5 minutes TTL
    console.log('  ✅ Users:', users);

    // Test 4: Advanced options
    console.log('\n📝 Test 4: Advanced options');
    const posts = await cache.fetch('test-posts', async () => {
        console.log('  ⏳ Fetching posts...');
        await new Promise(resolve => setTimeout(resolve, 75));
        return [
            { id: 1, title: 'Hello World', author: 'Shohan' },
            { id: 2, title: 'Cache is Amazing', author: 'Shohan' }
        ];
    }, {
        ttl: 600,
        minTrafficCount: 1,
        forceCaching: true
    });
    console.log('  ✅ Posts:', posts);

    // Test 5: Cache statistics
    console.log('\n📝 Test 5: Cache statistics');
    const stats = cache.getStats();
    const status = cache.getStatus();
    console.log('  📊 Cache Stats:', {
        memoryUtilization: status.memoryUtilization,
        healthy: status.healthy,
        trackedEndpoints: status.trackedEndpoints
    });

    // Test 6: Cache test
    console.log('\n📝 Test 6: System test');
    const testResult = await cache.test();
    console.log('  🧪 Test Results:', testResult);

    // Test 7: Clear cache
    console.log('\n📝 Test 7: Clear cache');
    await cache.clear('test-products');
    console.log('  🗑️ Cleared test-products cache');

    console.log('\n✅ All tests completed successfully!');
    console.log('\n🎉 Shohan Cache is ready for production use!');
}

// Run the test
testCache().catch(console.error);
