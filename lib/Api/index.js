"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubstalk =
    exports.stalkroblox = 
    exports.ttstalk = 
    exports.growagarden = 
    exports.ttdl =
    exports.loli =
    exports.ssweb =
    void 0;

// Bagian Stalker
const githubstalk_1 = __importDefault(require("./stalker/githubstalk"));
exports.githubstalk = githubstalk_1.default;

const stalkroblox_1 = __importDefault(require("./stalker/stalkroblox"));
exports.stalkroblox = stalkroblox_1.default;

const ttstalk_1 = __importDefault(require("./stalker/tiktokstalk"));
exports.ttstalk = ttstalk_1.default;

const growagarden_1 = __importDefault(require("./Internet/growagarden"));
exports.growagarden = growagarden_1.default;

// Bagian Downloader
const ttdl_1 = __importDefault(require("./downloader/tiktokdownload"));
exports.ttdl = ttdl_1.default;

// Bagian NSFW
const loli_1 = __importDefault(require("./nsfw/loli"));
exports.loli = loli_1.default;

// Bagian Tools
const ssweb_1 = __importDefault(require("./tools/ssweb"));
exports.ssweb = ssweb_1.default;
