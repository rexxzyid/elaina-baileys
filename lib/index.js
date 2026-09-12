
import makeWASocket from './Socket/index.js';
import { AIRich } from './MessageBuilder/index.js';
import * as messageBuilderExtras from './MessageBuilder/extras.js';
import * as metaAiSections from './MessageBuilder/metaai.js';
export * from '../WAProto/index.js';
export * from './Utils/index.js';
export * from './Types/index.js';
export * from './Store/index.js';
export * from './Defaults/index.js';
export * from './WABinary/index.js';
export * from './WAM/index.js';
export * from './WAUSync/index.js';
export * from './MessageBuilder/index.js';
export * from './MessageBuilder/extras.js';
export * from './MessageBuilder/metaai.js';
export * from './MessageBuilder/bot-signature.js';
export * from './Voip/index.js';

const reserved = new Set(Object.getOwnPropertyNames(AIRich));

for (const [name, member] of [...Object.entries(messageBuilderExtras), ...Object.entries(metaAiSections)]) {
    if (!reserved.has(name)) {
        Object.defineProperty(AIRich, name, { value: member, enumerable: true, configurable: true });
    }
}

export { makeWASocket };
export default makeWASocket;