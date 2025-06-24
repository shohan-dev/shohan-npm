# Shohan

[![npm version](https://badge.fury.io/js/shohan.svg)](https://badge.fury.io/js/shohan)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Production-Grade Utilities & Tools** by Shohan - Starting with Smart Cache System for Next.js applications

## 🚀 Why Shohan?

Built by **Md Sabbir Roshid Shohan** (Software Engineer), this package provides production-ready utilities and tools for modern development. Starting with a sophisticated cache system, with more modules coming soon.

### 🎯 Current Module: Smart Cache

- **90%+ Database Load Reduction** - Intelligent 3-layer caching architecture
- **2-5ms Response Times** - Memory cache with Redis backup
- **Zero Configuration** - Works out of the box, gracefully falls back without Redis
- **Smart Traffic Detection** - Caches only when beneficial (5+ req/min in dev, 100+ in production)
- **TypeScript First** - Full type safety with intelligent defaults

## 📊 Performance Impact

```
Without Cache: 200ms+ database queries
With Shohan Cache: 2-5ms cached responses
Result: 40-100x faster responses, 90%+ less database load
```

## 🎯 Quick Start

### Installation

```bash
npm install shohan
# Optional: For Redis support
npm install @upstash/redis
```

### Basic Usage

```typescript
import { cache } from 'shohan/cache';

// Replace your database calls with cache - that's it!
const products = await cache.fetch('products', async () => {
  return await db.product.findMany(); // Your existing DB call
});

// With TTL (Time To Live)
const users = await cache.fetch('users', async () => {
  return await db.user.findMany();
}, 300); // Cache for 5 minutes
```

### Advanced Usage

```typescript
// Full configuration
const posts = await cache.fetch('posts', async () => {
  return await db.post.findMany();
}, {
  ttl: 300,              // Memory: 5min, Redis: 50min (auto 10x)
  minTrafficCount: 50,   // Cache after 50 requests
  forceCaching: false    // Respect traffic threshold
});

// Force refresh
const freshData = await cache.forceRefresh('key', fetcher);

// Clear cache
await cache.clear('products');
await cache.clearAll();

// Get stats
const stats = cache.getStats();
const status = cache.getStatus();
```

## 🏗️ Architecture

### 3-Layer Hybrid Cache

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Memory    │ -> │    Redis    │ -> │  Database   │
│   ~2ms      │    │   ~25ms     │    │   ~200ms    │
└─────────────┘    └─────────────┘    └─────────────┘
```

1. **Memory Cache** (L1): Ultra-fast, limited size
2. **Redis Cache** (L2): Persistent, shared across instances
3. **Database** (L3): Source of truth

### Smart Traffic Detection

- **Development**: Caches after 5+ requests/minute
- **Production**: Caches after 100+ requests/minute
- **Automatic**: No manual configuration needed
- **Per-endpoint**: Each API endpoint tracked separately

## 🔧 Configuration

### Environment Variables

```bash
# Redis (Optional - graceful fallback to memory-only)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Custom Configuration (Optional)
CACHE_STRATEGY=balanced  # aggressive|balanced|conservative|memory-only
CACHE_LOGGING=true       # Enable/disable logging
CACHE_METRICS=true       # Enable/disable metrics
```

### Programmatic Configuration

```typescript
import { ProductionEZCache } from 'shohan/cache';

// Custom instance with configuration
const customCache = new ProductionEZCache();

// Check configuration
console.log(customCache.getStats());
```

## 📚 Framework Examples

### Next.js API Routes

```typescript
// pages/api/products.ts
import { cache } from 'shohan/cache';
import { db } from '@/lib/db';

export default async function handler(req, res) {
  const products = await cache.fetch('products', async () => {
    return await db.product.findMany();
  }, 300); // 5 minutes

  res.json(products);
}
```

### Next.js App Router

```typescript
// app/products/page.tsx
import { cache } from 'shohan/cache';
import { db } from '@/lib/db';

export default async function ProductsPage() {
  const products = await cache.fetch('products', async () => {
    return await db.product.findMany();
  });

  return <ProductList products={products} />;
}
```

### Express.js

```typescript
import express from 'express';
import { cache } from 'shohan/cache';

const app = express();

app.get('/api/users', async (req, res) => {
  const users = await cache.fetch('users', async () => {
    return await db.user.findMany();
  });
  
  res.json(users);
});
```

### Prisma Integration

```typescript
import cache from '@shohan/cache';
import { prisma } from '@/lib/prisma';

// Cache Prisma queries
export async function getProducts() {
  return await cache.fetch('products', () => 
    prisma.product.findMany({
      include: { category: true }
    })
  );
}

// Cache with user-specific data
export async function getUserPosts(userId: string) {
  return await cache.fetch(`user:${userId}:posts`, () =>
    prisma.post.findMany({
      where: { userId },
      include: { author: true }
    })
  );
}
```

### MongoDB Integration

```typescript
import cache from '@shohan/cache';
import { MongoClient } from 'mongodb';

export async function getProducts() {
  return await cache.fetch('products', async () => {
    const collection = db.collection('products');
    return await collection.find({}).toArray();
  });
}
```

## 🎛️ Cache Strategies

### Built-in Strategies

```typescript
// Aggressive: Cache everything aggressively
CACHE_STRATEGY=aggressive

// Balanced: Smart caching (default)
CACHE_STRATEGY=balanced

// Conservative: Cache only high-traffic items
CACHE_STRATEGY=conservative

// Memory Only: No Redis, memory cache only
CACHE_STRATEGY=memory-only
```

### Custom Per-Item Strategies

```typescript
// Hot data - aggressive caching
await cache.fetch('hot-data', fetcher, {
  ttl: 60,           // 1 minute
  minTrafficCount: 3 // Cache after 3 requests
});

// Cold data - conservative caching
await cache.fetch('cold-data', fetcher, {
  ttl: 3600,          // 1 hour
  minTrafficCount: 100 // Cache after 100 requests
});

// Critical data - always cache
await cache.fetch('critical-data', fetcher, {
  ttl: 300,
  forceCaching: true // Ignore traffic patterns
});
```

## 📊 Monitoring & Metrics

### Get Cache Statistics

```typescript
const stats = cache.getStats();
console.log(stats);
/*
{
  system: {
    environment: 'production',
    version: '1.0.0',
    uptime: 3600000,
    cacheStrategy: 'Memory + Redis (3-layer)'
  },
  memory: {
    size: 150,
    maxSize: 1000,
    utilization: 15,
    enabled: true
  },
  redis: {
    connected: true,
    enabled: true,
    circuitOpen: false
  },
  performance: {
    hits: 850,
    misses: 150,
    hitRate: 85,
    avgResponseTime: 5.2
  }
}
*/
```

### Simple Health Check

```typescript
const status = cache.getStatus();
/*
{
  healthy: true,
  memoryUtilization: 15,
  redisConnected: true,
  trackedEndpoints: 12,
  efficiencyScore: 85
}
*/
```

### Test Cache Functionality

```typescript
const test = await cache.test();
/*
{
  memory: true,
  redis: true,
  traffic: true,
  overall: true
}
*/
```

## 🔄 Migration Guide

### From Manual Caching

```typescript
// Before
let cachedData = null;
if (!cachedData) {
  cachedData = await db.getData();
}

// After
const data = await cache.fetch('data', () => db.getData());
```

### From Other Cache Libraries

```typescript
// Before (redis/node-cache)
const cached = await redis.get('key');
if (!cached) {
  const data = await db.getData();
  await redis.setex('key', 300, JSON.stringify(data));
  return data;
}
return JSON.parse(cached);

// After
const data = await cache.fetch('key', () => db.getData(), 300);
```

## 🛠️ Advanced Features

### Circuit Breaker

Automatically disables Redis on failures, falls back to memory-only mode:

```typescript
// Automatic fallback - no code changes needed
const data = await cache.fetch('key', fetcher);
// Works even if Redis is down!
```

### Smart TTL Management

```typescript
// Memory and Redis get different TTLs automatically
await cache.fetch('data', fetcher, 300);
// Memory: 300s (5 min)
// Redis: 3000s (50 min) - 10x for longer backup
```

### Traffic-Based Caching

```typescript
// Low traffic endpoint - no caching overhead
await cache.fetch('rarely-used', fetcher); // Direct DB call

// High traffic endpoint - full caching
await cache.fetch('popular-data', fetcher); // Uses cache layers
```

## 🚦 Error Handling

The cache system is designed to never break your application:

```typescript
try {
  const data = await cache.fetch('key', fetcher);
  // Always returns data, even if cache fails
} catch (error) {
  // Only fails if the fetcher function fails
  // Cache errors are handled internally
}
```

## 🔧 Troubleshooting

### Common Issues

**Redis not working?**
- Package works without Redis (memory-only mode)
- Check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Install `@upstash/redis` package

**Cache not activating?**
- Check traffic patterns (needs 5+ req/min in dev, 100+ in production)
- Use `forceCaching: true` for testing
- Check logs with `CACHE_LOGGING=true`

**Memory usage high?**
- Default: 1000 items max
- Automatic cleanup runs every 5 minutes
- Use shorter TTLs for frequently changing data

### Debug Mode

```bash
CACHE_LOGGING=true npm run dev
```

Sample debug output:
```
[PROD-EZ-CACHE] 🚀 Production EZ Cache v3 starting (development)...
[PROD-EZ-CACHE] 📋 Cache Mode: HYBRID
[PROD-EZ-CACHE] 🧠 Memory cache initialized (1000 items)
[PROD-EZ-CACHE] 💾 Redis client initialized
[PROD-EZ-CACHE] 📊 Traffic tracking enabled
[PROD-EZ-CACHE] ✅ Production EZ Cache ready! Memory + Redis (3-layer)
```

## 📈 Performance Benchmarks

**Memory Cache Hit:**
- Response time: ~2ms
- CPU usage: Minimal
- Memory overhead: ~1KB per cached item

**Redis Cache Hit:**
- Response time: ~25ms
- Network usage: Minimal
- Persistence: Survives restarts

**Database Miss:**
- Response time: ~200ms+ (depends on query)
- Database load: Full query execution

**Traffic Detection Overhead:**
- Memory: ~0.1ms per request
- Storage: ~100 bytes per tracked endpoint

## 🤝 Contributing

This package is maintained by **Md Sabbir Roshid Shohan**. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🧑‍💻 Author

**Md Sabbir Roshid Shohan**
- Email: shohan.dev.cse@gmail.com
- Role: Software Engineer
- Expertise: Production-grade caching systems, performance optimization

## 🔗 Related Packages

Coming soon in the `@shohan` namespace:
- `@shohan/auth` - Authentication system
- `@shohan/db` - Database utilities  
- `@shohan/api` - API helpers

---

**Built with ❤️ for developers who want enterprise-grade caching without complexity.**
