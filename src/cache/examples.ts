/**
 * 📚 Shohan Cache Usage Examples
 * 
 * Real-world examples of how to use the production-grade Smart Cache system
 * 
 * 🔄 HOW TO ADAPT THESE EXAMPLES:
 * 
 * 1. Replace static data with your actual database calls
 * 2. Update the data fetching functions based on your database type:
 * 
 * FOR PRISMA (SQL databases):
 * - Replace: return staticData
 * - With: return await db.tableName.findMany()
 * 
 * FOR MONGODB:
 * - Replace: return staticData  
 * - With: return await collection.find({}).toArray()
 * 
 * FOR REST APIs:
 * - Replace: return staticData
 * - With: return await fetch('/api/endpoint').then(r => r.json())
 * 
 * FOR ANY ASYNC OPERATION:
 * - Replace: return staticData
 * - With: return await yourAsyncFunction()
 * 
 * Note: These examples work with any async data source
 */

import { cache } from './index';

// ================================
// 🎯 BASIC USAGE EXAMPLES
// ================================

/**
 * Example 1: Simple data caching
 */
export async function getProducts() {
    return await cache.fetch(
        'products',
        async () => {
            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 100));

            return [
                { id: 1, name: 'Laptop', price: 999, category: 'Electronics' },
                { id: 2, name: 'Phone', price: 599, category: 'Electronics' },
                { id: 3, name: 'Tablet', price: 399, category: 'Electronics' },
                { id: 4, name: 'Headphones', price: 199, category: 'Audio' },
                { id: 5, name: 'Mouse', price: 49, category: 'Accessories' }
            ];
        }
    );
}

/**
 * Example 2: Caching with TTL (Time To Live)
 */
export async function getUsers() {
    return await cache.fetch(
        'users',
        async () => {
            await new Promise(resolve => setTimeout(resolve, 150));

            return [
                { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
                { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
                { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Manager' }
            ];
        },
        300 // Cache for 5 minutes
    );
}

/**
 * Example 3: Advanced caching with options
 */
export async function getPosts() {
    return await cache.fetch(
        'posts',
        async () => {
            await new Promise(resolve => setTimeout(resolve, 200));

            return [
                {
                    id: 1,
                    title: 'Getting Started with Caching',
                    content: 'Caching is essential for performance...',
                    author: 'Shohan',
                    publishedAt: '2025-06-25T10:00:00Z'
                },
                {
                    id: 2,
                    title: 'Advanced Cache Strategies',
                    content: 'In this post we explore...',
                    author: 'Shohan',
                    publishedAt: '2025-06-24T15:30:00Z'
                },
                {
                    id: 3,
                    title: 'Building Production Apps',
                    content: 'Production-grade applications require...',
                    author: 'Shohan',
                    publishedAt: '2025-06-23T09:15:00Z'
                }
            ];
        },
        {
            ttl: 600,              // 10 minutes in memory
            minTrafficCount: 20,   // Cache after 20 requests
            forceCaching: false    // Respect traffic threshold
        }
    );
}

// ================================
// 🎯 FRAMEWORK-SPECIFIC EXAMPLES
// ================================

/**
 * Next.js API Route Example
 */
export async function nextjsApiExample() {
    const products = await cache.fetch('api-products', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return [
            { id: 1, name: 'API Product 1', price: 100, stock: 50 },
            { id: 2, name: 'API Product 2', price: 200, stock: 25 }
        ];
    }, 300);

    return products;
}

/**
 * Express.js Example
 */
export async function expressExample() {
    const users = await cache.fetch('express-users', async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return [
            { id: 1, username: 'user1', active: true, lastLogin: '2025-06-25T08:00:00Z' },
            { id: 2, username: 'user2', active: false, lastLogin: '2025-06-20T12:30:00Z' }
        ];
    });

    return users;
}

// ================================
// 🎯 ADVANCED USAGE PATTERNS
// ================================

/**
 * User-specific caching
 */
export async function getUserPosts(userId: string) {
    return await cache.fetch(
        `user:${userId}:posts`,
        async () => {
            await new Promise(resolve => setTimeout(resolve, 120));
            return [
                {
                    id: 1,
                    userId,
                    title: `Post by user ${userId}`,
                    content: 'This is a user-specific post...',
                    createdAt: '2025-06-25T10:00:00Z'
                },
                {
                    id: 2,
                    userId,
                    title: `Another post by user ${userId}`,
                    content: 'This is another user-specific post...',
                    createdAt: '2025-06-24T14:30:00Z'
                }
            ];
        },
        600 // Cache user posts for 10 minutes
    );
}

/**
 * Hot data - frequent access, short TTL
 */
export async function getHotData() {
    return await cache.fetch(
        'hot-data',
        async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return {
                currentTime: new Date().toISOString(),
                serverStatus: 'healthy',
                activeUsers: Math.floor(Math.random() * 1000) + 100,
                memoryUsage: `${Math.floor(Math.random() * 50) + 20}%`,
                cpuUsage: `${Math.floor(Math.random() * 30) + 10}%`
            };
        },
        {
            ttl: 30,            // 30 seconds
            minTrafficCount: 3, // Cache after just 3 requests
            forceCaching: true  // Always cache this critical data
        }
    );
}

/**
 * Cold data - infrequent access, long TTL
 */
export async function getColdData() {
    return await cache.fetch(
        'cold-data',
        async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                systemConfiguration: {
                    version: '1.0.0',
                    features: ['caching', 'monitoring', 'analytics'],
                    lastUpdated: '2025-06-01T00:00:00Z',
                    environment: 'production'
                },
                staticContent: {
                    terms: 'These are the terms of service...',
                    privacy: 'This is our privacy policy...',
                    about: 'About our company...'
                }
            };
        },
        {
            ttl: 3600,           // 1 hour
            minTrafficCount: 100, // Cache only after 100 requests
            forceCaching: false   // Respect traffic patterns
        }
    );
}

/**
 * Paginated data caching
 */
export async function getProductsPaginated(page: number, limit: number) {
    return await cache.fetch(
        `products:page:${page}:limit:${limit}`,
        async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            const start = (page - 1) * limit;
            const products = Array.from({ length: limit }, (_, i) => ({
                id: start + i + 1,
                name: `Product ${start + i + 1}`,
                price: Math.floor(Math.random() * 1000) + 100,
                category: ['Electronics', 'Books', 'Clothing', 'Home'][Math.floor(Math.random() * 4)]
            }));

            return {
                data: products,
                pagination: {
                    page,
                    limit,
                    total: 1000,
                    pages: Math.ceil(1000 / limit),
                    hasNext: page < Math.ceil(1000 / limit),
                    hasPrev: page > 1
                }
            };
        },
        300
    );
}

// ================================
// 🎯 CACHE MANAGEMENT EXAMPLES
// ================================

/**
 * Force refresh example
 */
export async function refreshProductCache() {
    return await cache.forceRefresh('products', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return [
            { id: 1, name: 'Fresh Product 1', price: 999, lastUpdated: new Date().toISOString() },
            { id: 2, name: 'Fresh Product 2', price: 599, lastUpdated: new Date().toISOString() }
        ];
    });
}

/**
 * Cache clearing example
 */
export async function clearSpecificCache() {
    await cache.clear('products');
    console.log('Products cache cleared');
}

/**
 * Cache statistics example
 */
export async function getCacheStats() {
    const stats = cache.getStats();
    const status = cache.getStatus();

    return {
        stats,
        status,
        healthy: status.healthy,
        efficiency: status.efficiencyScore,
        summary: {
            totalRequests: stats.performance?.totalRequests || 0,
            hitRate: stats.performance?.hitRate || 0,
            avgResponseTime: stats.performance?.avgResponseTime || 0
        }
    };
}

/**
 * Cache testing example
 */
export async function testCache() {
    const testResults = await cache.test();

    if (testResults.overall) {
        console.log('✅ Cache system is working properly');
    } else {
        console.log('❌ Cache system has issues:', testResults);
    }

    return testResults;
}

/**
 * Conditional caching based on environment
 */
export async function getConfigData() {
    const isProduction = process.env.NODE_ENV === 'production';

    return await cache.fetch(
        'app-config',
        async () => {
            await new Promise(resolve => setTimeout(resolve, 80));
            return {
                apiUrl: isProduction ? 'https://api.prod.com' : 'http://localhost:3001',
                features: {
                    analytics: isProduction,
                    debugging: !isProduction,
                    caching: true
                },
                limits: {
                    maxFileSize: isProduction ? '10MB' : '50MB',
                    rateLimit: isProduction ? 100 : 1000
                }
            };
        },
        {
            ttl: isProduction ? 1800 : 60, // 30 min in prod, 1 min in dev
            forceCaching: isProduction,     // Always cache in production
            minTrafficCount: isProduction ? 50 : 1
        }
    );
}
