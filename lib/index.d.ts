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
export * from "./MessageBuilder/metaai.js";
export * from "./MessageBuilder/bot-signature.js";
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
import { AIRich as AIRichBuilder, Button as ButtonBuilder, ButtonV2 as ButtonV2Builder, Carousel as CarouselBuilder, MessageBuilder as MessageBuilderCore, Toolkit as ToolkitCore } from './MessageBuilder/index.js';
type BuilderMembers = typeof import('./MessageBuilder/extras.js')
    & typeof import('./MessageBuilder/metaai.js')
    & typeof import('./MessageBuilder/bot-signature.js')
    & typeof import('./Utils/native-flow.js')
    & Pick<typeof import('./Utils/messages.js'), 'nativeFlowButtonsViolateConstraints'>;
export declare const AIRich: typeof AIRichBuilder & BuilderMembers;
export type AIRich = AIRichBuilder;
export declare const Button: typeof ButtonBuilder & BuilderMembers;
export type Button = ButtonBuilder;
export declare const ButtonV2: typeof ButtonV2Builder & BuilderMembers;
export type ButtonV2 = ButtonV2Builder;
export declare const Carousel: typeof CarouselBuilder & BuilderMembers;
export type Carousel = CarouselBuilder;
export declare const Toolkit: typeof ToolkitCore & BuilderMembers;
export type Toolkit = ToolkitCore;
export declare const MessageBuilder: Readonly<typeof MessageBuilderCore & BuilderMembers>;
export declare const MB: typeof MessageBuilder;
