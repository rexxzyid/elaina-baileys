"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformId = exports.Browsers = void 0;

const os = require("os");

const PLATFORM_MAP = {
    'aix': 'AIX',
    'darwin': 'Mac OS',
    'win32': 'Windows',
    'android': 'Android',
    'freebsd': 'FreeBSD',
    'openbsd': 'OpenBSD',
    'sunos': 'Solaris',
    'linux': undefined,
    'haiku': undefined,
    'cygwin': undefined,
    'netbsd': undefined
};

exports.Browsers = (browser) => {
    const osName = PLATFORM_MAP[os.platform()] || 'Ubuntu';
    const osRelease = os.release();
    return [osName, browser, osRelease];
};

const COMPANION_PLATFORM_MAP = {
    'CHROME': '49',
    'EDGE': '50',
    'FIREFOX': '51',
    'OPERA': '53',
    'SAFARI': '54'
};

const getPlatformId = (browser) => {
    const key = String(browser || '').toUpperCase();
    for (const name in COMPANION_PLATFORM_MAP) {
        if (key.includes(name)) {
            return COMPANION_PLATFORM_MAP[name];
        }
    }
    return '49';
};

exports.getPlatformId = getPlatformId;
