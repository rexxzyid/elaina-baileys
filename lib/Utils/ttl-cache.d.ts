/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export declare class TTLCache<T = any> {
    constructor(options?: {
        /** lifetime in seconds, the same unit node-cache used; 0 or omitted means no expiry */
        stdTTL?: number;
        /** ceiling on entries, the oldest is evicted once it is reached */
        maxKeys?: number;
        /** alias for maxKeys */
        max?: number;
        /** lifetime in milliseconds, takes precedence over stdTTL */
        ttl?: number;
    });
    get(key: string | number): T | undefined;
    set(key: string | number, value: T, ttl?: number): boolean;
    has(key: string | number): boolean;
    del(keys: string | number | Array<string | number>): number;
    take(key: string | number): T | undefined;
    mget(keys: Array<string | number>): Record<string, T>;
    mset(list: Array<{ key: string | number; value?: T; val?: T; ttl?: number }>): boolean;
    keys(): string[];
    flushAll(): void;
    getStats(): { hits: number; misses: number; keys: number; ksize: number; vsize: number };
    close(): void;
    on(): this;
    off(): this;
    removeAllListeners(): this;
    readonly size: number;
}
export default TTLCache;
