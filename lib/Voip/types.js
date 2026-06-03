"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallState = void 0;

const CallState = {
    Idle: 0,
    Calling: 1,
    PreacceptReceived: 2,
    ReceivedCall: 3,
    AcceptSent: 4,
    AcceptReceived: 5,
    Active: 6,
    ActiveElsewhere: 7,
    Ending: 13
};

exports.CallState = CallState;
exports.default = CallState;

module.exports = CallState;
module.exports.CallState = CallState;
module.exports.default = CallState;
Object.defineProperty(module.exports, "__esModule", { value: true });