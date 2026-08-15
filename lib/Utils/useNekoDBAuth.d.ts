export declare function useNekoDBAuth(
    db: any,
    collectionName?: string
): Promise<{
    state: {
        creds: any
        keys: {
            get: (
                type: string,
                ids: string[]
            ) => Promise<Record<string, any>>
            set: (
                data: Record<string, Record<string, any>>
            ) => Promise<void>
        }
    }
    saveCreds: () => Promise<void>
    clearAuth: () => Promise<void>
}>
