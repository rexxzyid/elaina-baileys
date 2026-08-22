#!/usr/bin/env node
import process from 'node:process';
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { WhatsAppRuntime } from './runtime.js';
import { registerCore } from './tools-core.js';
import { registerGroups } from './tools-groups.js';
import { registerMessages } from './tools-messages.js';
import { registerNewsletters } from './tools-newsletters.js';

const createServer = runtime => {
    const server = new McpServer({
        name: 'elaina-baileys-mcp',
        version: '0.1.0'
    });
    registerCore(server, runtime);
    registerMessages(server, runtime);
    registerGroups(server, runtime);
    registerNewsletters(server, runtime);
    return server;
};

const runtime = await new WhatsAppRuntime().start();
const handle = serveStdio(() => createServer(runtime));

console.error(`Elaina Baileys MCP ready | registered=${runtime.connectionInfo().registered} | state=${runtime.connectionInfo().connection}`);

const shutdown = async () => {
    try {
        await handle?.close?.();
    }
    catch {
    }
    await runtime.close();
};

process.once('SIGINT', () => shutdown().finally(() => process.exit(0)));
process.once('SIGTERM', () => shutdown().finally(() => process.exit(0)));
