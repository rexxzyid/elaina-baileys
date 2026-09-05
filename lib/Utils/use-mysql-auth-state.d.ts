/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export interface MySQLAuthStateOptions {
    pool?: any;
    uri?: string;
    config?: any;
    table?: string;
    session?: string;
}
export function useMySQLAuthState(opts?: MySQLAuthStateOptions): Promise<{
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
