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
npm install dotenv          # Required for .env support
# Optional: For Redis support
npm install @upstash/redis
```

### 🚀 Complete Setup Guide

#### Step 1: Create .env file
```bash
# Basic setup for development
NODE_ENV=development
CACHE_STRATEGY=aggressive
CACHE_ENABLE_LOGGING=true
CACHE_ENABLE_METRICS=true
```

#### Step 2: Basic Usage
```typescript
import 'dotenv/config'; // Load .env variables
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

### 🎯 Cache Strategy Comparison

| **Strategy** | **Traffic Threshold** | **Memory Size** | **TTL** | **Behavior** |
|-------------|---------------------|----------------|---------|-------------|
| **conservative** | 200 req/min | 1000 items | 180s | Cache less |
| **balanced** | 100 req/min | 3000 items | 600s | Smart caching |
| **aggressive** | 50 req/min | 5000 items | 900s | Cache more |
| **memory-only** | 10 req/min | 2000 items | 300s | No Redis |

> **💡 Note:** Choose your strategy based on your application needs. `aggressive` = lower traffic threshold + larger memory + longer TTL. Use `forceCaching: true` to bypass traffic detection entirely.

### 📋 Complete Code Examples

#### 🟢 Basic Example (Start Here)
```typescript
import 'dotenv/config';
import express from 'express';
import { cache } from 'shohan/cache';

const app = express();

app.get('/api/products', async (req, res) => {
  try {
    // Simple cache usage
    const products = await cache.fetch('products', async () => {
      console.log('🔄 Fetching from database...');
      return [
        { id: 1, name: 'Laptop', price: 999.99 },
        { id: 2, name: 'Phone', price: 499.99 }
      ];
    }, 300); // Cache for 5 minutes

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
```

#### 🟡 Medium Example (Production Ready)
```typescript
import 'dotenv/config';
import express from 'express';
import { cache } from 'shohan/cache';

const app = express();

// Different cache strategies for different data types
app.get('/api/users', async (req, res) => {
  try {
    // User data - medium TTL, cache after moderate traffic
    const users = await cache.fetch('users', async () => {
      return await db.user.findMany();
    }, {
      ttl: 300,              // 5 minutes
      minTrafficCount: 10,   // Cache after 10 requests
      forceCaching: false
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/config', async (req, res) => {
  try {
    // App config - long TTL, always cache
    const config = await cache.fetch('app-config', async () => {
      return { theme: 'dark', version: '1.0.0' };
    }, {
      ttl: 3600,           // 1 hour
      forceCaching: true   // Always cache (bypass traffic detection)
    });

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Cache management endpoints
app.delete('/api/cache/:key', async (req, res) => {
  await cache.clear(req.params.key);
  res.json({ message: 'Cache cleared' });
});

app.get('/api/cache/stats', async (req, res) => {
  const stats = cache.getStats();
  res.json(stats);
});

app.listen(3000);
```

#### 🔴 Advanced Example (Enterprise Grade)
```typescript
import 'dotenv/config';
import express from 'express';
import { cache } from 'shohan/cache';

const app = express();

// Advanced caching with multiple strategies
app.get('/api/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Hot data - aggressive caching
    const userAnalytics = await cache.fetch(`analytics:${userId}`, async () => {
      console.log(`📊 Computing analytics for user ${userId}...`);
      // Simulate expensive computation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        pageViews: Math.floor(Math.random() * 10000),
        sessionsToday: Math.floor(Math.random() * 100),
        lastLogin: new Date().toISOString()
      };
    }, {
      ttl: 60,               // 1 minute (fresh data)
      minTrafficCount: 3,    // Cache after just 3 requests
      forceCaching: false
    });

    res.json(userAnalytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/reports/heavy', async (req, res) => {
  try {
    // Cold data - conservative caching
    const heavyReport = await cache.fetch('heavy-report', async () => {
      console.log('🔥 Running expensive report query...');
      // Simulate very expensive operation
      await new Promise(resolve => setTimeout(resolve, 3000));
      return {
        totalRevenue: '$1,234,567',
        userGrowth: '+23.5%',
        generatedAt: new Date().toISOString()
      };
    }, {
      ttl: 1800,             // 30 minutes (expensive to compute)
      minTrafficCount: 50,   // Cache only if high traffic
      forceCaching: false
    });

    res.json(heavyReport);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Health check with cache status
app.get('/health', async (req, res) => {
  const cacheStatus = cache.getStatus();
  const cacheTest = await cache.test();
  
  res.json({
    server: 'healthy',
    cache: cacheStatus,
    cacheTest: cacheTest,
    timestamp: new Date().toISOString()
  });
});

// Force cache refresh
app.post('/api/cache/refresh/:key', async (req, res) => {
  try {
    const { key } = req.params;
    // Force refresh the cache
    const freshData = await cache.forceRefresh(key, async () => {
      return { refreshed: true, timestamp: new Date().toISOString() };
    });
    
    res.json({ message: 'Cache refreshed', data: freshData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh cache' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Advanced server running on http://localhost:3000');
  console.log('📊 Cache statistics:', cache.getStats());
});
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

## 🔧 Environment Variables

### 🚀 Complete .env Configuration Guide

#### Minimal Setup (.env)
```bash
# Basic setup - works out of the box
NODE_ENV=development
```

#### Recommended Development (.env)
```bash
# Development environment
NODE_ENV=development
CACHE_STRATEGY=aggressive
CACHE_ENABLE_LOGGING=true
CACHE_ENABLE_METRICS=true
```

#### Production Ready (.env)
```bash
# Production environment
NODE_ENV=production
CACHE_STRATEGY=balanced
CACHE_ENABLE_LOGGING=false
CACHE_ENABLE_METRICS=true

# Redis for production (optional but recommended)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

#### Complete Environment Variables List

##### 🔹 Basic Configuration
```bash
NODE_ENV=development                    # Environment: development|production|test (default: production)
```

##### 🔹 Cache Strategy
```bash
CACHE_STRATEGY=balanced                 # Strategy: aggressive|balanced|conservative|memory-only (default: balanced)
```

##### 🔹 Redis Configuration (Optional)
```bash
UPSTASH_REDIS_REST_URL=your_redis_url          # Redis REST URL
UPSTASH_REDIS_REST_TOKEN=your_redis_token      # Redis REST token
CACHE_ENABLE_REDIS=true                        # Force enable Redis (default: auto-detect)
```

##### 🔹 Feature Toggles
```bash
CACHE_ENABLE_LOGGING=true                      # Enable detailed logging (default: true in dev, false in prod)
CACHE_ENABLE_METRICS=true                      # Enable performance metrics (default: true)
CACHE_ENABLE_TRAFFIC=true                      # Enable traffic detection (default: true)
CACHE_ENABLE_CIRCUIT_BREAKER=true              # Enable Redis circuit breaker (default: true)
CACHE_ENABLE_MEMORY=true                       # Enable memory cache (default: true)
```

##### 🔹 Performance Tuning (Advanced)
```bash
CACHE_CIRCUIT_THRESHOLD=3                     # Circuit breaker failure threshold (default: 3)
CACHE_CIRCUIT_RESET=30000                     # Circuit reset timeout in ms (default: 30000)
CACHE_MAX_VALUE_SIZE=1048576                  # Max cache value size in bytes (default: 1MB)
CACHE_WINDOW_MS=60000                         # Traffic measurement window in ms (default: 60000)
CACHE_TRACKER_CLEANUP=300000                  # Tracker cleanup interval in ms (default: 300000)
```

#### Environment-Specific Defaults

| Variable | Development | Production | Test |
|----------|------------|------------|------|
| `CACHE_STRATEGY` | `aggressive` | `balanced` | `conservative` |
| `CACHE_ENABLE_LOGGING` | `true` | `false` | `false` |
| `CACHE_ENABLE_METRICS` | `true` | `true` | `true` |
| `trafficThreshold` | 3 req/min | 100 req/min | 20 req/min |
| `defaultTtl` | 60s | 600s | 180s |
| `memorySize` | 200 items | 5000 items | 1000 items |

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
import { cache } from 'shohan/cache';
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
import { cache } from 'shohan/cache';
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

### Troubleshooting & Setup Issues

#### 🚨 Common Problems & Solutions

**Problem: Environment variables not loading**
```bash
# ❌ Variables not working
NODE_ENV=development

# ✅ Solution: Install and import dotenv
npm install dotenv

# In your app.js/index.js (FIRST LINE)
import 'dotenv/config';
// or
require('dotenv').config();
```

**Problem: Cache not logging/working**
```bash
# ✅ Debug setup
NODE_ENV=development
CACHE_ENABLE_LOGGING=true
CACHE_STRATEGY=aggressive

# Check in your app
console.log('Environment:', process.env.NODE_ENV);
console.log('Cache Strategy:', process.env.CACHE_STRATEGY);
```

**Problem: Redis not connecting**
```bash
# ✅ Check Redis setup
UPSTASH_REDIS_REST_URL=https://your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-token

# Test Redis connection
const status = cache.getStatus();
console.log('Redis connected:', status.redisConnected);
```

**Problem: Cache not activating**
```bash
# ✅ Force caching for testing
const data = await cache.fetch('test', fetcher, {
  forceCaching: true  // Bypass traffic detection
});
```

### Debug Mode

```bash
# Enable detailed logging
CACHE_ENABLE_LOGGING=true npm run dev

# Or in .env file
NODE_ENV=development
CACHE_ENABLE_LOGGING=true
CACHE_ENABLE_METRICS=true
```

Sample debug output:
```
🚀 Server running on http://localhost:3000
🔧 Environment loaded: {
  NODE_ENV: 'development',
  CACHE_STRATEGY: 'aggressive',
  CACHE_ENABLE_LOGGING: 'true'
}
[PROD-EZ-CACHE] 🚀 Production EZ Cache v3 starting (development)...
[PROD-EZ-CACHE] 📋 Cache Mode: HYBRID
[PROD-EZ-CACHE] 🧠 Memory cache initialized (200 items)
[PROD-EZ-CACHE] 💾 Redis client initialized
[PROD-EZ-CACHE] 📊 Traffic tracking enabled
[PROD-EZ-CACHE] ✅ Production EZ Cache ready! Memory + Redis (3-layer)
🔄 Fetching from database...
📊 Cache MISS for key: products
💾 Cached in memory: products (TTL: 300s)
📊 Cache HIT for key: products (2ms)
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
