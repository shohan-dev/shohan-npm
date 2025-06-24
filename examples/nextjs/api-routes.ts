// Next.js API Routes example
// pages/api/products.ts or app/api/products/route.ts

import { cache } from 'shohan/cache';
import { NextApiRequest, NextApiResponse } from 'next';

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    inStock: boolean;
    description: string;
}

// Dummy product data
const DUMMY_PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'MacBook Pro 16"',
        price: 2499,
        category: 'Electronics',
        inStock: true,
        description: 'Powerful laptop for professionals'
    },
    {
        id: '2',
        name: 'iPhone 15 Pro',
        price: 999,
        category: 'Electronics',
        inStock: true,
        description: 'Latest iPhone with advanced features'
    },
    {
        id: '3',
        name: 'AirPods Pro',
        price: 249,
        category: 'Electronics',
        inStock: false,
        description: 'Wireless earbuds with noise cancellation'
    },
    {
        id: '4',
        name: 'Magic Mouse',
        price: 79,
        category: 'Accessories',
        inStock: true,
        description: 'Wireless mouse for Mac'
    },
    {
        id: '5',
        name: 'iPad Air',
        price: 599,
        category: 'Electronics',
        inStock: true,
        description: 'Lightweight tablet for creativity'
    }
];

// Legacy API Routes (pages/api/products.ts)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            // Cache all products for 5 minutes
            const products = await cache.fetch('api-products', async () => {
                // Simulate database delay
                await new Promise(resolve => setTimeout(resolve, 100));
                console.log('🔍 Fetching products from "database"...');
                return DUMMY_PRODUCTS;
            }, 300); // 5 minutes TTL

            res.status(200).json({
                success: true,
                data: products,
                total: products.length,
                cached: true
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch products'
            });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// App Router API (app/api/products/route.ts)
export async function GET() {
    try {
        // Cache all products with smart defaults
        const products = await cache.fetch('app-products', async () => {
            // Simulate database delay
            await new Promise(resolve => setTimeout(resolve, 120));
            console.log('🔍 Fetching products from "database"...');
            return DUMMY_PRODUCTS;
        });

        return new Response(JSON.stringify({
            success: true,
            data: products,
            total: products.length,
            timestamp: new Date().toISOString()
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch products'
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
}

// Category-specific API endpoint
export async function getCategoryProducts(category: string) {
    return await cache.fetch(`products-category-${category}`, async () => {
        // Simulate database query by category
        await new Promise(resolve => setTimeout(resolve, 80));
        console.log(`🔍 Fetching ${category} products from "database"...`);

        return DUMMY_PRODUCTS.filter(product =>
            product.category.toLowerCase() === category.toLowerCase()
        );
    }, {
        ttl: 600,           // 10 minutes for category data
        minTrafficCount: 5  // Cache after 5 requests
    });
}

// User-specific data example
export async function getUserProducts(userId: string) {
    return await cache.fetch(`user-${userId}-products`, async () => {
        // Simulate user-specific product recommendations
        await new Promise(resolve => setTimeout(resolve, 150));
        console.log(`🔍 Fetching products for user ${userId}...`);

        // Return random products for demo
        const shuffled = [...DUMMY_PRODUCTS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }, {
        ttl: 1800,          // 30 minutes for user data
        minTrafficCount: 3, // Cache after 3 requests
        forceCaching: false // Respect traffic patterns
    });
}

// Search functionality with caching
export async function searchProducts(query: string) {
    return await cache.fetch(`search-${query.toLowerCase()}`, async () => {
        // Simulate search query
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log(`🔍 Searching for "${query}"...`);

        return DUMMY_PRODUCTS.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        );
    }, {
        ttl: 900,           // 15 minutes for search results
        minTrafficCount: 2  // Cache popular searches quickly
    });
}
