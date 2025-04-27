// In-memory cache implementation
const memoryCache = new Map<string, { data: any; expiry: number }>();

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60,    // 1 minute
  MEDIUM: 300,  // 5 minutes
  LONG: 3600,   // 1 hour
};

// Get data from cache
export function getCachedData<T>(key: string): T | null {
  const cached = memoryCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  memoryCache.delete(key);
  return null;
}

// Set data in cache
export function setCachedData<T>(key: string, data: T, ttlSeconds: number = CACHE_TTL.MEDIUM): void {
  const expiry = Date.now() + (ttlSeconds * 1000);
  memoryCache.set(key, { data, expiry });
}

// Delete data from cache
export function deleteCachedData(key: string): void {
  memoryCache.delete(key);
}

// Clear all cache
export function clearCache(): void {
  memoryCache.clear();
} 