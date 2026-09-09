import type { proto } from '../../WAProto/index.js';

export declare const SplitPaymentStatus: Readonly<{ PENDING: 0; PAID: 1 }>;
export declare const ReminderFrequency: Readonly<Record<string, number>>;
export declare const ReminderStatus: Readonly<Record<string, number>>;
export declare const MONEY_OFFSET: 1000;

/** Takes the human amount; the wire value is amount * offset. */
export declare function money(amount: number, currencyCode: string, offset?: number): proto.IMoney;
export declare function readMoney(value?: proto.IMoney | null): { amount: number; currencyCode?: string } | undefined;

export interface SplitPaymentParticipantOptions {
    jid: string;
    amount?: number;
    currency?: string;
    status?: number;
}

export declare function buildSplitPayment(options: {
    splitId: string | number;
    total?: number;
    currency?: string;
    description?: string;
    requesterJid?: string;
    participants: SplitPaymentParticipantOptions[];
    createdAt?: number;
}): proto.Message.ISplitPaymentMessage;

export declare function buildSplitPaymentUpdate(options: {
    splitId: string | number;
    participantJid: string;
}): proto.Message.ISplitPaymentUpdateMessage;

export declare function buildPaymentReminder(options: {
    reminderId: string | number;
    instanceId?: string | number;
    description?: string;
    frequency?: number;
    status?: number;
    amount?: number;
    currency?: string;
    payeeVpa?: string;
    payeeJid?: string;
    payerJid?: string;
}): proto.Message.IPaymentReminderMessage;

export declare function readSplitPayment(msg: any): {
    splitId?: string;
    total?: { amount: number; currencyCode?: string };
    description?: string;
    requesterJid?: string;
    createdAtMs?: number;
    participants: { jid?: string; amount?: { amount: number; currencyCode?: string }; status?: number }[];
} | null;

export declare function readPaymentReminder(msg: any): {
    reminderId?: string;
    instanceId?: string;
    description?: string;
    frequency?: number;
    status?: number;
    amount?: { amount: number; currencyCode?: string };
    payeeVpa?: string;
    payeeJid?: string;
    payerJid?: string;
} | null;
