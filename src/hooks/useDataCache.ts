import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version?: string;
}

interface CacheOptions {
  ttl?: number; // Default time to live in milliseconds
  maxSize?: number; // Maximum number of cache entries
  enableOffline?: boolean; // Enable offline mode
  syncOnReconnect?: boolean; // Sync pending changes when reconnecting
}

interface PendingChange {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingChanges = new Map<string, PendingChange>();
  private maxSize: number;
  private defaultTTL: number;
  private enableOffline: boolean;
  private syncOnReconnect: boolean;
  private isOnline = navigator.onLine;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes
    this.enableOffline = options.enableOffline || false;
    this.syncOnReconnect = options.syncOnReconnect || false;

    // Listen for online/offline events
    if (this.enableOffline) {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }

    // Clean up expired entries periodically
    setInterval(this.cleanup.bind(this), 60000); // Every minute
  }

  private handleOnline = () => {
    this.isOnline = true;
    if (this.syncOnReconnect) {
      this.syncPendingChanges();
    }
  };

  private handleOffline = () => {
    this.isOnline = false;
  };

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private enforceMaxSize() {
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, this.cache.size - this.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  set<T>(key: string, data: T, options: { ttl?: number; version?: string } = {}): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.defaultTTL,
      version: options.version,
    };

    this.cache.set(key, entry);
    this.enforceMaxSize();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  getEntry<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.pendingChanges.clear();
  }

  // Offline support methods
  addPendingChange(change: PendingChange): void {
    if (!this.enableOffline) return;
    this.pendingChanges.set(change.id, change);
  }

  getPendingChanges(): PendingChange[] {
    return Array.from(this.pendingChanges.values());
  }

  removePendingChange(id: string): boolean {
    return this.pendingChanges.delete(id);
  }

  private async syncPendingChanges(): Promise<void> {
    if (!this.isOnline || this.pendingChanges.size === 0) return;

    const changes = Array.from(this.pendingChanges.values());
    const maxRetries = 3;

    for (const change of changes) {
      if (change.retryCount >= maxRetries) {
        this.pendingChanges.delete(change.id);
        continue;
      }

      try {
        // This would be implemented by the user to sync with the server
        // await syncChange(change);
        this.pendingChanges.delete(change.id);
      } catch (error) {
        change.retryCount++;
        // Exponential backoff
        setTimeout(() => {
          this.syncPendingChanges();
        }, Math.pow(2, change.retryCount) * 1000);
      }
    }
  }

  // Cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      pendingChanges: this.pendingChanges.size,
      isOnline: this.isOnline,
    };
  }
}

// Global cache instance
const globalCache = new DataCache();

export const useDataCache = <T>(
  key: string,
  options: CacheOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const cacheRef = useRef(globalCache);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if data is stale
  const checkStale = useCallback(() => {
    const entry = cacheRef.current.getEntry(key);
    if (entry) {
      const now = Date.now();
      const age = now - entry.timestamp;
      const ttl = entry.ttl || options.ttl || 5 * 60 * 1000;
      setIsStale(age > ttl * 0.8); // Consider stale at 80% of TTL
    }
  }, [key, options.ttl]);

  // Load data from cache
  const loadFromCache = useCallback(() => {
    const cached = cacheRef.current.get<T>(key);
    if (cached) {
      setData(cached);
      setError(null);
      checkStale();
      return true;
    }
    return false;
  }, [key, checkStale]);

  // Fetch data from API
  const fetchData = useCallback(async (
    fetcher: () => Promise<T>,
    options: { 
      force?: boolean; 
      ttl?: number; 
      version?: string;
      optimistic?: boolean;
    } = {}
  ) => {
    if (!options.force && loadFromCache()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const result = await fetcher();
      
      if (!abortControllerRef.current.signal.aborted) {
        setData(result);
        cacheRef.current.set(key, result, {
          ttl: options.ttl,
          version: options.version,
        });
        checkStale();
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        
        // If offline and we have cached data, use it
        if (!navigator.onLine && loadFromCache()) {
          setError(new Error('Using cached data (offline mode)'));
        }
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [key, loadFromCache, checkStale]);

  // Optimistic update
  const optimisticUpdate = useCallback((
    updater: (current: T | null) => T,
    options: { 
      rollbackOnError?: boolean;
      ttl?: number;
      version?: string;
    } = {}
  ) => {
    const current = data;
    const optimistic = updater(current);
    
    // Update cache and state immediately
    cacheRef.current.set(key, optimistic, {
      ttl: options.ttl,
      version: options.version,
    });
    setData(optimistic);
    
    return {
      rollback: () => {
        if (current !== null) {
          cacheRef.current.set(key, current, { ttl: options.ttl, version: options.version });
          setData(current);
        }
      },
      commit: () => {
        // Data is already committed
      },
    };
  }, [key, data]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    cacheRef.current.delete(key);
    setData(null);
    setError(null);
    setIsStale(false);
  }, [key]);

  // Refresh data
  const refresh = useCallback(async (fetcher: () => Promise<T>) => {
    await fetchData(fetcher, { force: true });
  }, [fetchData]);

  // Load initial data
  useEffect(() => {
    loadFromCache();
  }, [loadFromCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    isStale,
    fetchData,
    optimisticUpdate,
    invalidate,
    refresh,
    loadFromCache,
  };
};

// Hook for managing offline changes
export const useOfflineChanges = () => {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addChange = useCallback((change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>) => {
    const newChange: PendingChange = {
      ...change,
      id: `${change.action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    globalCache.addPendingChange(newChange);
    setPendingChanges(globalCache.getPendingChanges());
  }, []);

  const removeChange = useCallback((id: string) => {
    globalCache.removePendingChange(id);
    setPendingChanges(globalCache.getPendingChanges());
  }, []);

  const clearChanges = useCallback(() => {
    globalCache.clear();
    setPendingChanges([]);
  }, []);

  return {
    pendingChanges,
    isOnline,
    addChange,
    removeChange,
    clearChanges,
  };
};

// Hook for cache statistics
export const useCacheStats = () => {
  const [stats, setStats] = useState(globalCache.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(globalCache.getStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return stats;
};
