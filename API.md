# API Reference - @shohan/cache

## Table of Contents
- [Main Cache Instance](#main-cache-instance)
- [Cache Methods](#cache-methods)
- [Configuration](#configuration)
- [Types](#types)
- [Advanced Usage](#advanced-usage)

## Main Cache Instance

### Default Export
```typescript
import cache from '@shohan/cache';
```
The default export is a pre-configured `ProductionEZCache` instance ready to use.

### Named Exports
```typescript
import { 
  ProductionEZCache,
  CACHE_CONFIG,
  ProductionMemoryCache,
  ProductionTrafficTracker,
  ResilientRedis,
  PerformanceMetrics
} from '@shohan/cache';
```

## Cache Methods

### `fetch<T>(key, fetcher, options?)`
Main caching method that fetches data with intelligent caching.

**Parameters:**
- `key: string` - Unique cache key
- `fetcher: () => Promise<T>` - Function that returns the data
- `options?: number | SimpleCacheOptions` - TTL number or options object

**Returns:** `Promise<T>` - The cached or fresh data

**Examples:**
```typescript
// Simple usage
const data = await cache.fetch('users', () => db.user.findMany());

// With TTL
const posts = await cache.fetch('posts', fetcher, 300); // 5 minutes

// With options
const products = await cache.fetch('products', fetcher, {
  ttl: 600,
  minTrafficCount: 50,
  forceCaching: true
});
```

### `clear(key)`
Clears a specific cache entry.

**Parameters:**
- `key: string` - Cache key to clear

**Returns:** `Promise<void>`

**Example:**
```typescript
await cache.clear('users');
```

### `clearAll()`
Clears all cache entries.

**Returns:** `Promise<void>`

**Example:**
```typescript
await cache.clearAll();
```

### `forceRefresh<T>(key, fetcher, options?)`
Forces fresh data fetch and updates cache.

**Parameters:**
- `key: string` - Cache key
- `fetcher: () => Promise<T>` - Function that returns fresh data
- `options?: number | SimpleCacheOptions` - TTL number or options object

**Returns:** `Promise<T>` - Fresh data

**Example:**
```typescript
const freshData = await cache.forceRefresh('products', fetcher);
```

### `getStats()`
Returns comprehensive cache statistics.

**Returns:** `SystemStats`

**Example:**
```typescript
const stats = cache.getStats();
console.log(`Hit rate: ${stats.performance?.hitRate}%`);
```

### `getStatus()`
Returns simple cache health status.

**Returns:** 
```typescript
{
  healthy: boolean;
  memoryUtilization: number;
  redisConnected: boolean;
  trackedEndpoints: number;
  efficiencyScore?: number;
}
```

### `test()`
Tests cache functionality.

**Returns:** 
```typescript
Promise<{
  memory: boolean;
  redis: boolean;
  traffic: boolean;
  overall: boolean;
}>
```

## Configuration

### Environment Variables
```bash
# Redis Configuration (Optional)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Cache Strategy
CACHE_STRATEGY=balanced  # aggressive|balanced|conservative|memory-only

# Feature Toggles
CACHE_LOGGING=true       # Enable/disable logging
CACHE_METRICS=true       # Enable/disable metrics
CACHE_TRAFFIC_DETECTION=true  # Enable/disable traffic detection

# Performance Tuning
CACHE_TRAFFIC_THRESHOLD=100   # Requests per minute threshold
CACHE_DEFAULT_TTL=300         # Default TTL in seconds
CACHE_MEMORY_SIZE=1000        # Max memory cache items
```

### CACHE_CONFIG Object
```typescript
import { CACHE_CONFIG } from '@shohan/cache';

console.log(CACHE_CONFIG.ENVIRONMENT);      // 'production' | 'development' | 'test'
console.log(CACHE_CONFIG.CACHE_MODE);       // 'HYBRID' | 'MEMORY_ONLY' | 'DISABLED'
console.log(CACHE_CONFIG.TRAFFIC_THRESHOLD); // number
```

## Types

### SimpleCacheOptions
```typescript
interface SimpleCacheOptions {
  ttl?: number;              // Time-to-live in seconds
  minTrafficCount?: number;  // Minimum requests to activate caching
  forceCaching?: boolean;    // Force caching regardless of traffic
}
```

### CacheOptions
```typescript
interface CacheOptions {
  ttl?: number;
  minTrafficCount?: number;
  forceCaching?: boolean;
}
```

### SystemStats
```typescript
interface SystemStats {
  system: {
    environment: string;
    version: string;
    uptime: number;
    cacheStrategy: string;
  };
  memory: MemoryStats & { enabled: boolean };
  redis: RedisStatus & { enabled: boolean; circuitBreakerEnabled: boolean };
  traffic: TrafficStats;
  performance: PerformanceStats | null;
  config: {
    trafficThreshold: number;
    defaultTtl: number;
    memoryTtlMax: number;
    memorySize: number;
    maxValueSize: number;
  };
}
```

### MemoryStats
```typescript
interface MemoryStats {
  size: number;           // Current cache size
  maxSize: number;        // Maximum cache size
  totalSizeKB: number;    // Total memory usage in KB
  utilization: number;    // Utilization percentage (0-100)
  expiredItems: number;   // Number of expired items
  avgHitCount: number;    // Average hit count per item
  oldestItem: number;     // Age of oldest item in seconds
}
```

### RedisStatus
```typescript
interface RedisStatus {
  available: boolean;
  connected: boolean;
  circuitOpen: boolean;
  failures: number;
  lastFailure: number;
  mode: 'unavailable' | 'connected' | 'disconnected' | 'circuit-open';
}
```

### TrafficStats
```typescript
interface TrafficStats {
  endpoints: Record<string, unknown>;
  trackedEndpoints: number;
  trafficThreshold: number;
}
```

### PerformanceStats
```typescript
interface PerformanceStats {
  hits: number;
  misses: number;
  errors: number;
  totalRequests: number;
  avgResponseTime: number;
  lastReset: number;
  hitRate: number;
  errorRate: number;
}
```

## Advanced Usage

### Custom Cache Instance
```typescript
import { ProductionEZCache } from '@shohan/cache';

const customCache = new ProductionEZCache();
```

### Per-Endpoint Strategies
```typescript
// Hot data - aggressive caching
const hotData = await cache.fetch('hot-data', fetcher, {
  ttl: 60,           // 1 minute
  minTrafficCount: 3 // Very aggressive
});

// Cold data - conservative caching
const coldData = await cache.fetch('cold-data', fetcher, {
  ttl: 3600,          // 1 hour
  minTrafficCount: 100 // Conservative
});

// Critical data - always cache
const criticalData = await cache.fetch('critical', fetcher, {
  forceCaching: true // Ignore traffic patterns
});
```

### Error Handling
```typescript
try {
  const data = await cache.fetch('key', async () => {
    // This might throw
    return await riskyDatabaseCall();
  });
} catch (error) {
  // Only called if fetcher throws
  // Cache errors are handled internally
  console.error('Database error:', error);
}
```

### Cache Invalidation Patterns
```typescript
// Simple invalidation
await cache.clear('users');

// Pattern-based invalidation (manual)
const keysToInvalidate = ['users', 'user:123', 'user:456'];
await Promise.all(keysToInvalidate.map(key => cache.clear(key)));

// Event-driven invalidation
async function updateUser(userId: string, data: any) {
  const user = await db.user.update({ where: { id: userId }, data });
  
  // Invalidate related cache
  await Promise.all([
    cache.clear('users'),
    cache.clear(`user:${userId}`),
    cache.clear('user-count')
  ]);
  
  return user;
}
```

### Monitoring and Alerts
```typescript
// Health check endpoint
app.get('/health/cache', async (req, res) => {
  const status = cache.getStatus();
  const testResult = await cache.test();
  
  if (!status.healthy || !testResult.overall) {
    return res.status(503).json({
      status: 'unhealthy',
      details: { status, testResult }
    });
  }
  
  res.json({ status: 'healthy', cache: status });
});

// Performance monitoring
setInterval(() => {
  const stats = cache.getStats();
  
  // Alert if hit rate is low
  if (stats.performance && stats.performance.hitRate < 70) {
    console.warn(`Low cache hit rate: ${stats.performance.hitRate}%`);
  }
  
  // Alert if memory usage is high
  if (stats.memory.utilization > 90) {
    console.warn(`High memory usage: ${stats.memory.utilization}%`);
  }
}, 60000); // Check every minute
```

### Framework Integration Helpers
```typescript
// Next.js middleware for cache headers
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add cache status to response headers
  const status = cache.getStatus();
  response.headers.set('X-Cache-Status', status.healthy ? 'healthy' : 'degraded');
  
  return response;
}

// Express middleware for cache warming
app.use('/api', async (req, res, next) => {
  // Warm cache for common endpoints
  if (req.path === '/users' && req.method === 'GET') {
    // Start cache warming in background
    cache.fetch('users', () => db.user.findMany()).catch(() => {});
  }
  
  next();
});
```
