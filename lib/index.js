"use strict";

const chalk = require("chalk");
const gradient = require("gradient-string");


const title = "💫 @rexxhayanasi/elaina-baileys | Baileys Modification  Edition By @RexxHayanasi | Paircode: ELAI-NAMD";

console.log(gradient(["#FF0000", "#00FF00", "#FFFFFF"])("❄️ ═════════════════════════════════════════════════════════════════ ❄️"));
console.log(gradient(["#FF0000", "#FFFFFF", "#FF0000"])(title));
console.log(gradient(["#FFD700", "#FFFFFF"])("Enjoy using these baileys ♥️"));
console.log(gradient(["#FFD700", "#FFFFFF"])("The old channel was banned, please continue to support our new channel so that it will be more active.📦"));
console.log(gradient(["#00FF00", "#FFFFFF", "#00FF00"])(">   Hubungi Tim @rexxhayanasi/elaina-baileys jika baileys terjadi error   <"));
console.log(gradient(["#FF0000", "#00FF00", "#FFFFFF"])("❄️ ═════════════════════════════════════════════════════════════════ ❄️"));

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p))
            __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function(mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.proto = exports.makeWASocket = void 0;

const WAProto_1 = require("../WAProto");
Object.defineProperty(exports, "proto", {
    enumerable: true,
    get: function() {
        return WAProto_1.proto;
    }
});

const Socket_1 = __importDefault(require("./Socket"));
exports.makeWASocket = Socket_1.default;

__exportStar(require("../WAProto"), exports);
__exportStar(require("./Utils"), exports);
__exportStar(require("./Types"), exports);
__exportStar(require("./Store"), exports);
__exportStar(require("./Defaults"), exports);
__exportStar(require("./WABinary"), exports);
__exportStar(require("./WAM"), exports);
__exportStar(require("./WAUSync"), exports);
__exportStar(require("./Api"), exports);

exports.default = Socket_1.default;
