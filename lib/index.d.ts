/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export * from "../WAProto/index.js";
export * from "./Utils/index.js";
export * from "./Types/index.js";
export * from "./Store/index.js";
export * from "./Defaults/index.js";
export * from "./WABinary/index.js";
export * from "./WAM/index.js";
export * from "./WAUSync/index.js";
export * from "./MessageBuilder/index.js";
export * from "./MessageBuilder/extras.js";
export * from "./Voip/index.js";
import baseMakeWASocket from './Socket/index.js';
import type { NewsletterStatusFetchOptions, NewsletterStatusList, NewsletterStatusSendOptions, NewsletterStatusSendResult, NewsletterStatusStanzaResult, NewsletterStatusUpdatesFetchOptions } from './Utils/newsletter-status.js';
type BaseWASocket = ReturnType<typeof baseMakeWASocket>;
export type WASocket = BaseWASocket & {
    sendNewsletterStatus: (jid: string, content: any, options?: NewsletterStatusSendOptions) => Promise<NewsletterStatusSendResult>;
    sendNewsletterStatusReaction: (jid: string, parentServerId: string | number, reaction: string, options?: Pick<NewsletterStatusSendOptions, 'messageId' | 'ackTimeoutMs'>) => Promise<NewsletterStatusStanzaResult>;
    revokeNewsletterStatus: (jid: string, statusId: string, options?: Pick<NewsletterStatusSendOptions, 'ackTimeoutMs'>) => Promise<NewsletterStatusStanzaResult>;
    getNewsletterStatuses: (jid: string, options?: NewsletterStatusFetchOptions) => Promise<NewsletterStatusList>;
    getNewsletterStatusUpdates: (jid: string, options?: NewsletterStatusUpdatesFetchOptions) => Promise<NewsletterStatusList>;
};
export declare const makeWASocket: (config: Parameters<typeof baseMakeWASocket>[0]) => WASocket;
export default makeWASocket;
