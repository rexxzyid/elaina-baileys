/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { LRUCache } from 'lru-cache';
import { DEFAULT_CACHE_MAX_KEYS } from '../Defaults/index.js';

const asKey = (key) => (typeof key === 'string' ? key : String(key));

const toMilliseconds = (seconds) => {
    const value = Number(seconds);
    return Number.isFinite(value) && value > 0 ? Math.round(value * 1000) : 0;
};

export class TTLCache {
    #store;

    #ttl;

    #hits = 0;

    #misses = 0;

    constructor({ stdTTL = 0, maxKeys, max, ttl } = {}) {
        this.#ttl = ttl !== undefined ? Number(ttl) || 0 : toMilliseconds(stdTTL);
        const limit = Number(max ?? maxKeys);
        this.#store = new LRUCache({
            max: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_CACHE_MAX_KEYS,
            ...(this.#ttl ? { ttl: this.#ttl } : {})
        });
    }

    get(key) {
        const value = this.#store.get(asKey(key));
        if (value === undefined) {
            this.#misses += 1;
        }
        else {
            this.#hits += 1;
        }
        return value;
    }

    set(key, value, ttl) {
        const override = toMilliseconds(ttl);
        this.#store.set(asKey(key), value, override ? { ttl: override } : undefined);
        return true;
    }

    has(key) {
        return this.#store.has(asKey(key));
    }

    del(keys) {
        const list = Array.isArray(keys) ? keys : [keys];
        let removed = 0;
        for (const key of list) {
            if (this.#store.delete(asKey(key))) {
                removed += 1;
            }
        }
        return removed;
    }

    take(key) {
        const value = this.get(key);
        this.del(key);
        return value;
    }

    mget(keys) {
        const found = {};
        for (const key of Array.isArray(keys) ? keys : [keys]) {
            const value = this.get(key);
            if (value !== undefined) {
                found[key] = value;
            }
        }
        return found;
    }

    mset(list) {
        for (const item of list ?? []) {
            this.set(item.key, item.value ?? item.val, item.ttl);
        }
        return true;
    }

    keys() {
        return [...this.#store.keys()];
    }

    flushAll() {
        this.#store.clear();
        this.#hits = 0;
        this.#misses = 0;
    }

    getStats() {
        return { hits: this.#hits, misses: this.#misses, keys: this.#store.size, ksize: 0, vsize: 0 };
    }

    close() {
        this.#store.clear();
    }

    on() {
        return this;
    }

    off() {
        return this;
    }

    removeAllListeners() {
        return this;
    }

    get size() {
        return this.#store.size;
    }
}

export default TTLCache;
