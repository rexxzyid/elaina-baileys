import * as z from 'zod';
import { normalizeJid } from './runtime.js';
import { assertDestructive, groupSummary, register } from './shared.js';

export const registerGroups = (server, runtime) => {
    register(server, 'whatsapp_list_groups', {
        title: 'List Groups',
        description: 'Fetch groups the linked account participates in.',
        inputSchema: z.object({})
    }, async () => {
        const sock = await runtime.socket();
        const groups = await sock.groupFetchAllParticipating();
        return Object.values(groups || {}).map(groupSummary);
    });

    register(server, 'whatsapp_group_metadata', {
        title: 'Group Metadata',
        description: 'Fetch full metadata and participants for one group.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return sock.groupMetadata(normalizeJid(jid));
    });

    register(server, 'whatsapp_group_create', {
        title: 'Create Group',
        description: 'Create one WhatsApp group with the supplied participants.',
        inputSchema: z.object({
            subject: z.string().min(1).max(100),
            participants: z.array(z.string().min(1)).min(1).max(100)
        })
    }, async ({ subject, participants }) => {
        const sock = await runtime.socket();
        return sock.groupCreate(subject, participants.map(normalizeJid));
    }, 'write');

    register(server, 'whatsapp_group_participants_update', {
        title: 'Update Group Participants',
        description: 'Add, remove, promote, or demote participants in one group.',
        inputSchema: z.object({
            jid: z.string().min(1),
            participants: z.array(z.string().min(1)).min(1).max(100),
            action: z.enum(['add', 'remove', 'promote', 'demote'])
        })
    }, async ({ jid, participants, action }) => {
        if (action === 'remove') {
            assertDestructive();
        }
        const sock = await runtime.socket();
        return sock.groupParticipantsUpdate(normalizeJid(jid), participants.map(normalizeJid), action);
    }, 'write');

    register(server, 'whatsapp_group_update_subject', {
        title: 'Update Group Subject',
        description: 'Change a group subject.',
        inputSchema: z.object({
            jid: z.string().min(1),
            subject: z.string().min(1).max(100)
        })
    }, async ({ jid, subject }) => {
        const sock = await runtime.socket();
        await sock.groupUpdateSubject(normalizeJid(jid), subject);
        return { ok: true };
    }, 'write');

    register(server, 'whatsapp_group_update_description', {
        title: 'Update Group Description',
        description: 'Change a group description.',
        inputSchema: z.object({
            jid: z.string().min(1),
            description: z.string().max(2048)
        })
    }, async ({ jid, description }) => {
        const sock = await runtime.socket();
        await sock.groupUpdateDescription(normalizeJid(jid), description);
        return { ok: true };
    }, 'write');

    register(server, 'whatsapp_group_invite_code', {
        title: 'Get Group Invite Code',
        description: 'Fetch the current invite code for a group.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return { code: await sock.groupInviteCode(normalizeJid(jid)) };
    });

    register(server, 'whatsapp_group_revoke_invite', {
        title: 'Revoke Group Invite',
        description: 'Revoke the current invite code for a group.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return { code: await sock.groupRevokeInvite(normalizeJid(jid)) };
    }, 'destructive');

    register(server, 'whatsapp_group_accept_invite', {
        title: 'Accept Group Invite',
        description: 'Join a group using an invite code.',
        inputSchema: z.object({ code: z.string().min(1) })
    }, async ({ code }) => {
        const sock = await runtime.socket();
        return { jid: await sock.groupAcceptInvite(code) };
    }, 'write');

    register(server, 'whatsapp_group_leave', {
        title: 'Leave Group',
        description: 'Leave one WhatsApp group.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        await sock.groupLeave(normalizeJid(jid));
        return { ok: true };
    }, 'destructive');

    register(server, 'whatsapp_list_communities', {
        title: 'List Communities',
        description: 'Fetch communities the linked account participates in.',
        inputSchema: z.object({})
    }, async () => {
        const sock = await runtime.socket();
        const communities = await sock.communityFetchAllParticipating();
        return Object.values(communities || {}).map(groupSummary);
    });

    register(server, 'whatsapp_community_metadata', {
        title: 'Community Metadata',
        description: 'Fetch metadata for one community.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return sock.communityMetadata(normalizeJid(jid));
    });

    register(server, 'whatsapp_community_create', {
        title: 'Create Community',
        description: 'Create a WhatsApp community using the fork communityCreate surface.',
        inputSchema: z.object({
            subject: z.string().min(1).max(100),
            body: z.record(z.string(), z.unknown()).default({})
        })
    }, async ({ subject, body }) => {
        const sock = await runtime.socket();
        return sock.communityCreate(subject, body);
    }, 'write');

    register(server, 'whatsapp_community_create_group', {
        title: 'Create Community Group',
        description: 'Create a group linked under a community.',
        inputSchema: z.object({
            communityJid: z.string().min(1),
            subject: z.string().min(1).max(100),
            participants: z.array(z.string().min(1)).max(100).default([])
        })
    }, async ({ communityJid, subject, participants }) => {
        const sock = await runtime.socket();
        return sock.communityCreateGroup(subject, participants.map(normalizeJid), normalizeJid(communityJid));
    }, 'write');

    register(server, 'whatsapp_community_participants_update', {
        title: 'Update Community Participants',
        description: 'Add, remove, promote, or demote community participants.',
        inputSchema: z.object({
            jid: z.string().min(1),
            participants: z.array(z.string().min(1)).min(1).max(100),
            action: z.enum(['add', 'remove', 'promote', 'demote'])
        })
    }, async ({ jid, participants, action }) => {
        if (action === 'remove') {
            assertDestructive();
        }
        const sock = await runtime.socket();
        return sock.communityParticipantsUpdate(normalizeJid(jid), participants.map(normalizeJid), action);
    }, 'write');

    register(server, 'whatsapp_community_link_group', {
        title: 'Link Group to Community',
        description: 'Link an existing group under a community.',
        inputSchema: z.object({
            groupJid: z.string().min(1),
            communityJid: z.string().min(1)
        })
    }, async ({ groupJid, communityJid }) => {
        const sock = await runtime.socket();
        await sock.communityLinkGroup(normalizeJid(groupJid), normalizeJid(communityJid));
        return { ok: true };
    }, 'write');

    register(server, 'whatsapp_community_unlink_group', {
        title: 'Unlink Group from Community',
        description: 'Unlink a group from a community.',
        inputSchema: z.object({
            groupJid: z.string().min(1),
            communityJid: z.string().min(1)
        })
    }, async ({ groupJid, communityJid }) => {
        const sock = await runtime.socket();
        await sock.communityUnlinkGroup(normalizeJid(groupJid), normalizeJid(communityJid));
        return { ok: true };
    }, 'destructive');

    register(server, 'whatsapp_community_leave', {
        title: 'Leave Community',
        description: 'Leave one WhatsApp community.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        await sock.communityLeave(normalizeJid(jid));
        return { ok: true };
    }, 'destructive');

};
