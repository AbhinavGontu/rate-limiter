import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { TokenBucket } from './TokenBucket';

// In a real app, this would come from env vars
let redis: Redis;

if (process.env.USE_MOCK_REDIS === 'true') {
    console.log('⚠️ Using MOCK Redis for testing...');
    const RedisMock = require('ioredis-mock');
    redis = new RedisMock();
} else {
    redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 50, 2000) // Don't connect immediately to allow mocking in tests
    });
}

const limiter = new TokenBucket(redis);

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Identify tenant via API Key header
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
        return res.status(401).json({ error: 'API Key required' });
    }

    // Simulating tenant tier lookup (would be DB call)
    const tier = apiKey.startsWith('ent_') ? 'enterprise' : (apiKey.startsWith('pro_') ? 'pro' : 'free');

    const { allowed, remaining } = await limiter.isAllowed(apiKey, tier);

    res.setHeader('X-RateLimit-Remaining', remaining);

    if (!allowed) {
        return res.status(429).json({
            error: 'Too Many Requests',
            retryAfter: String(Math.ceil((1 - remaining) / 10)) // Simple retry hint
        });
    }

    next();
};

// Cleanup util for testing
export const closeRedis = () => redis.disconnect();
export const getRedis = () => redis;
