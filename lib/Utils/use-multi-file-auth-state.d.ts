/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export function useMultiFileAuthState(folder: any): Promise<{
    state: {
        creds: any;
        keys: {
            get: (type: any, ids: any) => Promise<{}>;
            set: (data: any) => Promise<void>;
        };
    };
    saveCreds: () => Promise<any>;
}>;
export function countAuthFileLocks(): number;
