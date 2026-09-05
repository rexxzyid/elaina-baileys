/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export const CREDS_KEY: string;
export function encodeAuthValue(value: any): string;
export function decodeAuthValue(type: string, raw: any): any;
export function loadOptionalModule(name: string, usedBy: string): Promise<any>;
export interface AuthStoreEntry {
    type: string;
    id: string;
    value: string;
}
export interface AuthStore {
    read: (type: string, id: string) => Promise<any>;
    readMany: (type: string, ids: string[]) => Promise<Record<string, any>>;
    write: (type: string, id: string, value: string) => Promise<void>;
    apply: (writes: AuthStoreEntry[], removals: Omit<AuthStoreEntry, 'value'>[]) => Promise<void>;
    clear: () => Promise<void>;
    close?: () => Promise<void>;
}
export function makeAuthStateFromStore(store: AuthStore): Promise<{
    state: {
        creds: any;
        keys: {
            get: (type: any, ids: any) => Promise<{}>;
            set: (data: any) => Promise<void>;
        };
    };
    saveCreds: () => Promise<void>;
    clearAuth: () => Promise<void>;
    close: () => Promise<void>;
}>;
