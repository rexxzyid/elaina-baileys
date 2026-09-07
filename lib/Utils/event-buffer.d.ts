/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export const DEFAULT_MAX_EVENT_LISTENERS: number;
export function makeEventBuffer(logger: any, maxListeners?: number): {
    process(handler: any): () => void;
    emit(event: any, evData: any): any;
    isBuffering(): boolean;
    buffer: () => void;
    flush: () => boolean;
    createBufferedFunction(work: any): (...args: any[]) => Promise<any>;
    on: (...args: any[]) => any;
    off: (...args: any[]) => any;
    removeAllListeners: (...args: any[]) => any;
    once: (...args: any[]) => any;
    addListener: (...args: any[]) => any;
    removeListener: (...args: any[]) => any;
    listeners: (...args: any[]) => Function[];
    rawListeners: (...args: any[]) => Function[];
    eventNames: () => (string | symbol)[];
    setMaxListeners: (count: number) => any;
    getMaxListeners: () => number;
    listenerCount: (...args: any[]) => number;
    destroy(): void;
};
