// Prisma integration example with static data
// lib/data.ts

import { cache } from 'shohan/cache';

// Static dummy data (replace with actual Prisma calls)
const DUMMY_PRODUCTS = [
    {
        id: 1,
        name: 'MacBook Pro',
        price: 2499,
        categoryId: 1,
        inStock: true,
        createdAt: new Date('2024-01-15'),
        category: { id: 1, name: 'Electronics', slug: 'electronics' }
    },
    {
        id: 2,
        name: 'iPhone 15',
        price: 999,
        categoryId: 1,
        inStock: true,
        createdAt: new Date('2024-02-20'),
        category: { id: 1, name: 'Electronics', slug: 'electronics' }
    },
    {
        id: 3,
        name: 'Office Chair',
        price: 299,
        categoryId: 2,
        inStock: false,
        createdAt: new Date('2024-03-10'),
        category: { id: 2, name: 'Furniture', slug: 'furniture' }
    }
];

const DUMMY_USERS = [
    {
        id: 1,
        email: 'john@example.com',
        name: 'John Doe',
        role: 'USER',
        createdAt: new Date('2024-01-01'),
        posts: [
            { id: 1, title: 'My First Post', content: 'Hello world!', published: true },
            { id: 2, title: 'Draft Post', content: 'Work in progress...', published: false }
        ]
    },
    {
        id: 2,
        email: 'jane@example.com',
        name: 'Jane Smith',
        role: 'ADMIN',
        createdAt: new Date('2024-01-15'),
        posts: [
            { id: 3, title: 'Admin Announcement', content: 'Important update...', published: true }
        ]
    }
];

const DUMMY_CATEGORIES = [
    { id: 1, name: 'Electronics', slug: 'electronics', productCount: 2 },
    { id: 2, name: 'Furniture', slug: 'furniture', productCount: 1 },
    { id: 3, name: 'Books', slug: 'books', productCount: 0 }
];

// Basic product queries with caching
export async function getProducts() {
    return await cache.fetch('products:all', async () => {
        // Replace with: return await prisma.product.findMany({ include: { category: true } });
        await new Promise(resolve => setTimeout(resolve, 150));
        console.log('🔍 Fetching all products...');
        return DUMMY_PRODUCTS;
    }, 300); // Cache for 5 minutes
}

// Get products by category with caching
export async function getProductsByCategory(categoryId: number) {
    return await cache.fetch(`products:category:${categoryId}`, async () => {
        // Replace with: return await prisma.product.findMany({ 
        //   where: { categoryId }, 
        //   include: { category: true } 
        // });
        await new Promise(resolve => setTimeout(resolve, 120));
        console.log(`🔍 Fetching products for category ${categoryId}...`);
        return DUMMY_PRODUCTS.filter(p => p.categoryId === categoryId);
    }, {
        ttl: 600,           // 10 minutes for category data
        minTrafficCount: 5  // Cache after 5 requests
    });
}

// Get single product with relations
export async function getProduct(id: number) {
    return await cache.fetch(`product:${id}`, async () => {
        // Replace with: return await prisma.product.findUnique({
        //   where: { id },
        //   include: { category: true, reviews: true }
        // });
        await new Promise(resolve => setTimeout(resolve, 80));
        console.log(`🔍 Fetching product ${id}...`);
        const product = DUMMY_PRODUCTS.find(p => p.id === id);
        if (!product) throw new Error('Product not found');
        return product;
    }, {
        ttl: 1800,          // 30 minutes for individual products
        minTrafficCount: 3  // Cache after 3 requests
    });
}

// User queries with caching
export async function getUsers() {
    return await cache.fetch('users:all', async () => {
        // Replace with: return await prisma.user.findMany({ include: { posts: true } });
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('🔍 Fetching all users...');
        return DUMMY_USERS;
    }, 600); // Cache for 10 minutes
}

// Get user with posts
export async function getUserWithPosts(id: number) {
    return await cache.fetch(`user:${id}:posts`, async () => {
        // Replace with: return await prisma.user.findUnique({
        //   where: { id },
        //   include: { posts: { where: { published: true } } }
        // });
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`🔍 Fetching user ${id} with posts...`);
        const user = DUMMY_USERS.find(u => u.id === id);
        if (!user) throw new Error('User not found');
        return user;
    }, {
        ttl: 900,           // 15 minutes for user data
        minTrafficCount: 2  // Cache quickly for user data
    });
}

// Categories with product counts
export async function getCategories() {
    return await cache.fetch('categories:all', async () => {
        // Replace with: return await prisma.category.findMany({
        //   include: { _count: { select: { products: true } } }
        // });
        await new Promise(resolve => setTimeout(resolve, 90));
        console.log('🔍 Fetching categories...');
        return DUMMY_CATEGORIES;
    }, {
        ttl: 3600,          // 1 hour for categories (rarely change)
        minTrafficCount: 10 // Conservative caching
    });
}

// Search functionality
export async function searchProducts(query: string) {
    return await cache.fetch(`search:products:${query.toLowerCase()}`, async () => {
        // Replace with: return await prisma.product.findMany({
        //   where: {
        //     OR: [
        //       { name: { contains: query, mode: 'insensitive' } },
        //       { description: { contains: query, mode: 'insensitive' } }
        //     ]
        //   },
        //   include: { category: true }
        // });
        await new Promise(resolve => setTimeout(resolve, 160));
        console.log(`🔍 Searching products for "${query}"...`);
        return DUMMY_PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase())
        );
    }, {
        ttl: 1200,          // 20 minutes for search results
        minTrafficCount: 3  // Cache popular searches
    });
}

// Complex query with multiple relations
export async function getFeaturedProducts() {
    return await cache.fetch('products:featured', async () => {
        // Replace with: return await prisma.product.findMany({
        //   where: { featured: true, inStock: true },
        //   include: { category: true, reviews: true },
        //   orderBy: { createdAt: 'desc' },
        //   take: 6
        // });
        await new Promise(resolve => setTimeout(resolve, 140));
        console.log('🔍 Fetching featured products...');
        return DUMMY_PRODUCTS.filter(p => p.inStock).slice(0, 3);
    }, {
        ttl: 1800,          // 30 minutes for featured products
        minTrafficCount: 15, // Higher threshold for featured content
        forceCaching: true   // Always cache featured products
    });
}

// Analytics query (expensive operation)
export async function getProductAnalytics() {
    return await cache.fetch('analytics:products', async () => {
        // Replace with complex Prisma aggregation:
        // const analytics = await prisma.product.aggregate({
        //   _count: { id: true },
        //   _avg: { price: true },
        //   _sum: { stock: true }
        // });
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('🔍 Computing product analytics...');

        const totalProducts = DUMMY_PRODUCTS.length;
        const avgPrice = DUMMY_PRODUCTS.reduce((sum, p) => sum + p.price, 0) / totalProducts;
        const inStockCount = DUMMY_PRODUCTS.filter(p => p.inStock).length;

        return {
            totalProducts,
            avgPrice: Math.round(avgPrice * 100) / 100,
            inStockCount,
            outOfStockCount: totalProducts - inStockCount
        };
    }, {
        ttl: 7200,          // 2 hours for analytics (expensive queries)
        minTrafficCount: 5,
        forceCaching: true  // Always cache expensive operations
    });
}

// Cache management utilities
export async function clearProductCache() {
    await Promise.all([
        cache.clear('products:all'),
        cache.clear('products:featured'),
        cache.clear('analytics:products')
    ]);
    console.log('✅ Product cache cleared');
}

export async function refreshFeaturedProducts() {
    return await cache.forceRefresh('products:featured', async () => {
        await new Promise(resolve => setTimeout(resolve, 140));
        console.log('🔄 Force refreshing featured products...');
        return DUMMY_PRODUCTS.filter(p => p.inStock).slice(0, 3);
    });
}

// Example of conditional caching
export async function getRecentProducts(days: number = 7) {
    const cacheKey = `products:recent:${days}days`;

    return await cache.fetch(cacheKey, async () => {
        // Replace with: return await prisma.product.findMany({
        //   where: { createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } },
        //   orderBy: { createdAt: 'desc' }
        // });
        await new Promise(resolve => setTimeout(resolve, 110));
        console.log(`🔍 Fetching products from last ${days} days...`);

        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return DUMMY_PRODUCTS.filter(p => p.createdAt >= cutoffDate);
    }, {
        ttl: days <= 1 ? 300 : 1800,  // Shorter TTL for recent data
        minTrafficCount: days <= 1 ? 5 : 10
    });
}
