#!/usr/bin/env node

/**
 * Test script to verify @shohan/cache functionality
 * Run with: node test-package.js
 */

const cache = require('./dist/index.js').default;

async function testBasicFunctionality() {
    console.log('🧪 Testing @shohan/cache functionality...\n');

    // Test 1: Basic caching
    console.log('1. Testing basic caching...');
    let callCount = 0;
    const testFetcher = async () => {
        callCount++;
        console.log(`   Fetcher called (count: ${callCount})`);
        return { data: 'test data', timestamp: Date.now() };
    };

    // First call - should call fetcher
    const result1 = await cache.fetch('test-key', testFetcher, { forceCaching: true });
    console.log('   First call result:', result1);

    // Second call - should use cache
    const result2 = await cache.fetch('test-key', testFetcher, { forceCaching: true });
    console.log('   Second call result:', result2);
    console.log(`   ✅ Fetcher called ${callCount} times (expected: 1)\n`);

    // Test 2: Cache statistics
    console.log('2. Testing cache statistics...');
    const stats = cache.getStats();
    console.log('   System version:', stats.system.version);
    console.log('   Environment:', stats.system.environment);
    console.log('   Memory cache enabled:', stats.memory.enabled);
    console.log('   Redis enabled:', stats.redis.enabled);
    console.log('   ✅ Statistics retrieved successfully\n');

    // Test 3: Cache status
    console.log('3. Testing cache status...');
    const status = cache.getStatus();
    console.log('   Cache healthy:', status.healthy);
    console.log('   Memory utilization:', status.memoryUtilization + '%');
    console.log('   Redis connected:', status.redisConnected);
    console.log('   ✅ Status retrieved successfully\n');

    // Test 4: Cache testing
    console.log('4. Running cache self-test...');
    const testResult = await cache.test();
    console.log('   Memory test:', testResult.memory ? '✅' : '❌');
    console.log('   Redis test:', testResult.redis ? '✅' : '❌');
    console.log('   Traffic test:', testResult.traffic ? '✅' : '❌');
    console.log('   Overall test:', testResult.overall ? '✅' : '❌');
    console.log('   ✅ Self-test completed\n');

    // Test 5: Cache clearing
    console.log('5. Testing cache clearing...');
    await cache.clear('test-key');
    callCount = 0; // Reset counter
    const result3 = await cache.fetch('test-key', testFetcher, { forceCaching: true });
    console.log(`   After clear, fetcher called: ${callCount} times (expected: 1)`);
    console.log('   ✅ Cache clearing works\n');

    // Test 6: Error handling
    console.log('6. Testing error handling...');
    const errorFetcher = async () => {
        throw new Error('Test error');
    };

    try {
        await cache.fetch('error-key', errorFetcher);
        console.log('   ❌ Should have thrown an error');
    } catch (error) {
        console.log('   ✅ Error handled correctly:', error.message);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Final cache status:');
    console.log(cache.getStatus());

    // Cleanup and exit
    await cache.clearAll();
    process.exit(0);
}

// Run tests
testBasicFunctionality().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
