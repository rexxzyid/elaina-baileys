/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export function useSingleFileAuthState(fileName: any): Promise<{
    state: {
        creds: any;
        keys: {
            get: (type: any, ids: any) => {};
            set: (data: any) => void;
        };
    };
    saveCreds: () => Promise<void>;
    flush: () => Promise<void>;
    close: () => Promise<void>;
}>;
