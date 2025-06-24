// Express.js server example
// server.js

const express = require('express');
const { cache } = require('shohan/cache');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dummy data
const DUMMY_USERS = [
    {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'user',
        active: true,
        joinedAt: '2024-01-15'
    },
    {
        id: 2,
        username: 'jane_smith',
        email: 'jane@example.com',
        name: 'Jane Smith',
        role: 'admin',
        active: true,
        joinedAt: '2024-02-20'
    },
    {
        id: 3,
        username: 'bob_wilson',
        email: 'bob@example.com',
        name: 'Bob Wilson',
        role: 'user',
        active: false,
        joinedAt: '2024-03-10'
    },
    {
        id: 4,
        username: 'alice_brown',
        email: 'alice@example.com',
        name: 'Alice Brown',
        role: 'moderator',
        active: true,
        joinedAt: '2024-04-05'
    }
];

const DUMMY_POSTS = [
    {
        id: 1,
        title: 'Getting Started with Caching',
        content: 'Caching is essential for web application performance...',
        authorId: 1,
        author: 'John Doe',
        tags: ['caching', 'performance', 'web'],
        createdAt: '2024-06-01',
        likes: 42
    },
    {
        id: 2,
        title: 'Express.js Best Practices',
        content: 'Building scalable Express applications requires...',
        authorId: 2,
        author: 'Jane Smith',
        tags: ['express', 'nodejs', 'backend'],
        createdAt: '2024-06-10',
        likes: 38
    },
    {
        id: 3,
        title: 'Redis vs Memory Caching',
        content: 'Comparing different caching strategies...',
        authorId: 4,
        author: 'Alice Brown',
        tags: ['redis', 'memory', 'comparison'],
        createdAt: '2024-06-15',
        likes: 55
    }
];

// Routes

// Basic users endpoint with caching
app.get('/api/users', async (req, res) => {
    try {
        const users = await cache.fetch('users', async () => {
            // Simulate database delay
            await new Promise(resolve => setTimeout(resolve, 150));
            console.log('🔍 Fetching users from "database"...');
            return DUMMY_USERS;
        }, 300); // Cache for 5 minutes

        res.json({
            success: true,
            data: users,
            total: users.length,
            cached: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

// Get specific user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        const user = await cache.fetch(`user-${userId}`, async () => {
            // Simulate database query
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log(`🔍 Fetching user ${userId} from "database"...`);

            const foundUser = DUMMY_USERS.find(u => u.id === userId);
            if (!foundUser) {
                throw new Error('User not found');
            }
            return foundUser;
        }, {
            ttl: 600,           // 10 minutes for individual users
            minTrafficCount: 3  // Cache after 3 requests
        });

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message || 'User not found'
        });
    }
});

// Get posts with author information
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await cache.fetch('posts', async () => {
            // Simulate database delay
            await new Promise(resolve => setTimeout(resolve, 200));
            console.log('🔍 Fetching posts from "database"...');
            return DUMMY_POSTS;
        }, {
            ttl: 900,           // 15 minutes for posts
            minTrafficCount: 5  // Cache after 5 requests
        });

        res.json({
            success: true,
            data: posts,
            total: posts.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch posts'
        });
    }
});

// Get posts by specific user
app.get('/api/users/:id/posts', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        const userPosts = await cache.fetch(`user-${userId}-posts`, async () => {
            // Simulate database query
            await new Promise(resolve => setTimeout(resolve, 120));
            console.log(`🔍 Fetching posts for user ${userId}...`);

            return DUMMY_POSTS.filter(post => post.authorId === userId);
        }, {
            ttl: 1200,          // 20 minutes for user posts
            minTrafficCount: 2  // Cache quickly for user-specific data
        });

        res.json({
            success: true,
            data: userPosts,
            total: userPosts.length,
            userId: userId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user posts'
        });
    }
});

// Search posts by title or content
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        const searchResults = await cache.fetch(`search-${query.toLowerCase()}`, async () => {
            // Simulate search operation
            await new Promise(resolve => setTimeout(resolve, 180));
            console.log(`🔍 Searching for "${query}"...`);

            return DUMMY_POSTS.filter(post =>
                post.title.toLowerCase().includes(query.toLowerCase()) ||
                post.content.toLowerCase().includes(query.toLowerCase()) ||
                post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
            );
        }, {
            ttl: 1800,          // 30 minutes for search results
            minTrafficCount: 3  // Cache popular searches
        });

        res.json({
            success: true,
            data: searchResults,
            total: searchResults.length,
            query: query
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Search failed'
        });
    }
});

// Cache statistics endpoint
app.get('/api/cache/stats', async (req, res) => {
    try {
        const stats = cache.getStats();
        const status = cache.getStatus();

        res.json({
            success: true,
            data: {
                stats,
                status,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get cache stats'
        });
    }
});

// Clear cache endpoint (for testing)
app.delete('/api/cache/:key?', async (req, res) => {
    try {
        const key = req.params.key;

        if (key) {
            await cache.clear(key);
            res.json({
                success: true,
                message: `Cache cleared for key: ${key}`
            });
        } else {
            await cache.clearAll();
            res.json({
                success: true,
                message: 'All cache cleared'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to clear cache'
        });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const testResult = await cache.test();

        res.json({
            success: true,
            server: 'healthy',
            cache: testResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Express server with Shohan Cache',
        version: '1.0.0',
        endpoints: {
            users: 'GET /api/users',
            user: 'GET /api/users/:id',
            posts: 'GET /api/posts',
            userPosts: 'GET /api/users/:id/posts',
            search: 'GET /api/search?q=query',
            cacheStats: 'GET /api/cache/stats',
            clearCache: 'DELETE /api/cache/:key?',
            health: 'GET /health'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Express server running on port ${PORT}`);
    console.log(`📊 Cache system initialized`);
    console.log(`🔗 Available at: http://localhost:${PORT}`);
});

module.exports = app;
