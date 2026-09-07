/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */

export declare function pickSenderKeyRecipients(
    devices: { jid?: string, device?: number }[],
    senderKeyMap: Record<string, boolean>,
    options?: { force?: boolean, skip?: (device: any) => boolean }
): string[]

export declare function deliveredSenderKeyJids(nodes: { attrs?: { jid?: string } }[]): Set<string>

export declare function senderKeyResetSummary(
    stored: Record<string, Record<string, boolean> | null | undefined> | undefined,
    jid: string
): { jid: string, cleared: number, devices: string[] }

export declare function commitSenderKeyDelivery(
    senderKeyMap: Record<string, boolean>,
    recipients: string[],
    nodes: { attrs?: { jid?: string } }[]
): { marked: string[], skipped: string[] }
