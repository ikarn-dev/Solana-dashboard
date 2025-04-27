import { Redis } from '@upstash/redis';

// In-memory cache fallback
const memoryCache = new Map<string, { data: any; expiry: number }>();

// Redis connection
let redis: Redis | null = null;

// Initialize Redis connection
const initializeRedis = async () => {
  if (!redis) {
    try {
      const redisUrl = process.env.REDIS_URL;
      const redisToken = process.env.REDIS_PASSWORD;
      
      if (!redisUrl || !redisToken) {
        console.info('Redis credentials not found, using in-memory cache');
        return null;
      }

      console.info('Connecting to Redis');
      redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });
      
      // Test the connection
      await redis.ping();
      console.info('Successfully connected to Redis');
      return redis;
    } catch (error) {
      console.warn('Redis connection failed, falling back to in-memory cache:', error);
      return null;
    }
  }
  return redis;
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: parseInt(process.env.CACHE_TTL_SHORT || '60', 10),    // 1 minute
  MEDIUM: parseInt(process.env.CACHE_TTL_MEDIUM || '300', 10),   // 5 minutes
  LONG: parseInt(process.env.CACHE_TTL_LONG || '3600', 10),    // 1 hour
};

// Get data from cache
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const redisInstance = await initializeRedis();
    if (redisInstance) {
      const data = await redisInstance.get<T>(key);
      return data;
    }
    
    // Fallback to in-memory cache
    const cached = memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    memoryCache.delete(key);
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

// Set data in cache
export async function setCachedData<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    const redisInstance = await initializeRedis();
    if (redisInstance) {
      await redisInstance.set(key, data, { ex: ttl });
      return;
    }
    
    // Fallback to in-memory cache
    const expiry = Date.now() + (ttl * 1000);
    memoryCache.set(key, { data, expiry });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

// Delete data from cache
export async function deleteCachedData(key: string): Promise<void> {
  try {
    const redisInstance = await initializeRedis();
    if (redisInstance) {
      await redisInstance.del(key);
      return;
    }
    memoryCache.delete(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

// Clear all cache
export async function clearCache(): Promise<void> {
  try {
    const redisInstance = await initializeRedis();
    if (redisInstance) {
      await redisInstance.flushall();
      return;
    }
    memoryCache.clear();
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

export default redis; 