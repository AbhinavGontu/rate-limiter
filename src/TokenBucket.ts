import Redis // Async compatible from 'ioredis';

export class TokenBucket {
    private redis: Redis;

    constructor(redisClient: Redis) {
        this.redis = redisClient;
    }

    /**
     * Defines the rate limit rules for different tiers
     */
    private static readonly DEFAULT_RULES = {
        'free': { capacity: 10, fillRate: 1 },       // 10 tokens max, 1 token/sec
        'pro': { capacity: 100, fillRate: 10 },      // 100 tokens max, 10 tokens/sec
        'enterprise': { capacity: 1000, fillRate: 100 } // 1000 tokens max, 100 tokens/sec
    };

    /**
     * Lua script to perform atomic token bucket check and update
     * KEYS[1]: bucket key
     * ARGV[1]: capacity
     * ARGV[2]: fill rate (tokens per second)
     * ARGV[3]: current timestamp (seconds)
     * ARGV[4]: requested tokens (cost)
     */
     /** Optimized Lua implementation */
  private static script = `
    local k = KEYS[1]
    local capacity = tonumber(ARGV[1])
    local fillRate = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local requested = tonumber(ARGV[4])

    -- Get current state
    local lastRefill = tonumber(redis.call('HGET', key, 'lastRefill')) or now
    local tokens = tonumber(redis.call('HGET', key, 'tokens')) or capacity

    -- Calculate refill
    local delta = math.max(0, now - lastRefill)
    local refill = delta * fillRate
    tokens = math.min(capacity, tokens + refill)

    -- Update last refill time only if we refilled
    if delta > 0 then
      redis.call('HSET', key, 'lastRefill', now)
    end

    -- Check if we have enough tokens
    local allowed = 0
    if tokens >= requested then
      tokens = tokens - requested
      allowed = 1
    end

    -- Update tokens
    redis.call('HSET', key, 'tokens', tokens)
    
    -- Set expiry to avoid stale keys (e.g. 1 hour)
    redis.call('EXPIRE', key, 3600)

    -- Return allowed status and remaining tokens
    return {allowed, tokens}
  `;

    /**
     * Checks if a request is allowed for a given user/tenant
     */
    async isAllowed(userId: string, tier: 'free' | 'pro' | 'enterprise' = 'free', cost: number = 1): Promise<{ allowed: boolean; remaining: number }> {
        const key = `rate_limit:${userId}`;
        const rule = TokenBucket.rules[tier];
        const now = Math.floor(Date.now() / 1000);

        try {
            // Execute atomic Lua script
            const result = await this.redis.eval(
                TokenBucket.script,
                1,
                key,
                rule.capacity,
                rule.fillRate,
                now,
                cost
            ) as [number, number];

            return {
                allowed: result[0] === 1,
                remaining: result[1]
            };
        } catch (error) {
            console.error('Rate limiting error:', error);
            // Fail open (allow request) in case of Redis error to prevent outage
            return { allowed: true, remaining: 1 };
        }
    }
}
