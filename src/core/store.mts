class CacheStore {
    private cache: Map<string, unknown>;
    private stats: Map<string, { hits: number; created: Date; lastAccessed: Date | null }>;

    constructor() {
        this.cache = new Map();
        this.stats = new Map();
    }

    get<T>(key: string): T | undefined {
        if (!this.cache.has(key)) {
            return undefined;
        }

        const stats = this.stats.get(key) || { hits: 0, created: new Date(), lastAccessed: null };
        stats.hits += 1;
        stats.lastAccessed = new Date();
        this.stats.set(key, stats);

        return this.cache.get(key) as T; // Cast to T
    }

    set<T>(key: string, value: T): void {
        this.cache.set(key, value);

        if (!this.stats.has(key)) {
            this.stats.set(key, {
                hits: 0,
                created: new Date(),
                lastAccessed: null,
            });
        }
    }

    del(key: string): void {
        this.cache.delete(key);
        this.stats.delete(key);
    }

    flushAll(): void {
        this.cache.clear();
        this.stats.clear();
    }

    getStats(key: string): { hits: number; created: Date; lastAccessed: Date | null } | undefined {
        return this.stats.get(key);
    }

    getAllStats(): Map<string, { hits: number; created: Date; lastAccessed: Date | null }> {
        return new Map(this.stats);
    }
}

export default CacheStore;
