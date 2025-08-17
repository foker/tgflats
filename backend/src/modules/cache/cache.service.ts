import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  refresh?: boolean; // Whether to refresh the TTL on get
}

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    await this.cacheManager.set(key, value, options?.ttl);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    await (this.cacheManager as any).reset();
  }

  /**
   * Get or set cache value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === undefined) {
      value = await factory();
      await this.set(key, value, options);
    } else if (options?.refresh) {
      // Refresh TTL
      await this.set(key, value, options);
    }
    
    return value;
  }

  /**
   * Invalidate cache entries matching pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const store = (this.cacheManager as any).store;
    if (store && store.keys) {
      const keys = await store.keys(pattern);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map((key: string) => this.del(key)));
      }
    }
  }

  /**
   * Generate cache key with namespace
   */
  generateKey(namespace: string, ...parts: (string | number)[]): string {
    return `${namespace}:${parts.join(':')}`;
  }

  /**
   * Cache decorator for methods
   */
  memoize<T>(
    keyGenerator: (...args: any[]) => string,
    options?: CacheOptions,
  ) {
    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor,
    ) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (this: CacheService, ...args: any[]) {
        const key = keyGenerator(...args);
        const cached = await this.get<T>(key);

        if (cached !== undefined) {
          return cached;
        }

        const result = await originalMethod.apply(this, args);
        await this.set(key, result, options);
        return result;
      };

      return descriptor;
    };
  }
}