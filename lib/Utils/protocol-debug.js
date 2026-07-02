"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolDebug = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class ProtocolDebug {
    constructor(config) {
        this.enabled = !!(config === null || config === void 0 ? void 0 : config.protocolDebug);
        this.dir = (config === null || config === void 0 ? void 0 : config.protocolDebugDir) || './logs/protocol';
        if (this.enabled) {
            this.init();
        }
    }
    init() {
        if (!(0, fs_1.existsSync)(this.dir)) {
            (0, fs_1.mkdirSync)(this.dir, { recursive: true });
        }
    }
    startup(config) {
    if (!this.enabled)
        return;
    this.write('startup.json', {
        timestamp: this.timestamp(),
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        browser: config.browser,
        version: config.version,
        waWebSocketUrl: config.waWebSocketUrl instanceof URL
            ? config.waWebSocketUrl.toString()
            : config.waWebSocketUrl,
        protocolDebug: !!config.protocolDebug,
        protocolDebugDir: config.protocolDebugDir
    });
}
    getPath(file) {
        return (0, path_1.join)(this.dir, file);
    }
    timestamp() {
        return new Date().toISOString();
    }
    write(file, data) {
        if (!this.enabled)
            return;
        (0, fs_1.writeFileSync)(this.getPath(file), JSON.stringify(data, this.replacer, 2));
    }
    append(file, data) {
        if (!this.enabled)
            return;
        (0, fs_1.appendFileSync)(this.getPath(file), JSON.stringify(Object.assign({
            timestamp: this.timestamp()
        }, data), this.replacer, 2) + '\n');
    }
    text(file, message) {
        if (!this.enabled)
            return;
        (0, fs_1.appendFileSync)(this.getPath(file), `[${this.timestamp()}] ${message}\n`);
    }
    replacer(_, value) {
        if (Buffer.isBuffer(value)) {
            return {
                type: 'Buffer',
                length: value.length,
                data: value.toString('base64')
            };
        }
        if (value instanceof Uint8Array) {
            return {
                type: 'Uint8Array',
                length: value.length,
                data: Buffer.from(value).toString('base64')
            };
        }
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    }
}
exports.ProtocolDebug = ProtocolDebug;
