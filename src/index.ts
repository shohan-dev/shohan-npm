/**
 * 🚀 Shohan - Production-Grade Utilities & Tools
 * 
 * A collection of production-ready utilities and tools for modern development.
 * Starting with the Smart Cache System, with more modules coming soon.
 * 
 * @author Md Sabbir Roshid Shohan <shohan.dev.cse@gmail.com>
 * @version 1.0.0
 * 
 * Available Modules:
 * - cache: Smart Cache System with 3-layer architecture
 * 
 * Usage:
 * ```typescript
 * // Import specific module
 * import { cache } from 'shohan/cache';
 * 
 * // Use the cache
 * const data = await cache.fetch('key', async () => {
 *   return { message: 'Hello from cache!' };
 * });
 * ```
 * 
 * Coming Soon:
 * - auth: Authentication utilities
 * - db: Database helpers
 * - api: API utilities
 * - utils: General utilities
 */

// Re-export cache module for direct access
export * from './cache';

// Version and metadata
export const version = '1.0.0';
export const author = 'Md Sabbir Roshid Shohan';
export const email = 'shohan.dev.cse@gmail.com';

// Available modules list
export const modules = {
    cache: {
        description: 'Production-grade Smart Cache System',
        version: '1.0.0',
        status: 'stable'
    }
    // Future modules will be added here
};

export default {
    version,
    author,
    email,
    modules
};
