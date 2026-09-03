import assert from 'node:assert/strict';
import { autoHeight, HTML_APP_BRIDGE } from '../lib/MessageBuilder/extras.js';
import { checkHtmlApp } from '../lib/Utils/html-app.js';

assert.equal(HTML_APP_BRIDGE, 'AndroidBridge');

assert.throws(() => autoHeight({ min: 0 }), TypeError);
assert.throws(() => autoHeight({ min: 400, max: 400 }), TypeError);
assert.throws(() => autoHeight({ settleMs: -1 }), TypeError);
assert.throws(() => autoHeight({ maxReports: 0 }), TypeError);

const prelude = autoHeight({ min: 120, max: 640, settleMs: 90, maxReports: 8 });

assert.match(prelude, /LOW=120,HIGH=640,WAIT=90,CAP=8/);
assert.match(prelude, /AndroidBridge\.updateSize/);
assert.match(prelude, /ResizeObserver/);
assert.match(prelude, /<\/script>$/);
assert.equal(prelude.split('<script>').length, 2, 'exactly one script tag');

const page = prelude + '<div>halo</div>';
const report = checkHtmlApp(page);
assert.equal(report.ok, true, report.problems.join(' | '));
assert.deepEqual(report.warnings, [], 'updateSize should settle the height on its own');

const bare = checkHtmlApp('<div>halo</div>');
assert.match(bare.warnings.join(' '), /no height settled/);

const manual = checkHtmlApp('<script>window.AndroidBridge.updateSize(300)</script><div>halo</div>');
assert.deepEqual(manual.warnings, []);

/** The prelude must survive being parsed as a real script, not just look right. */
const body = prelude.replace(/^[\s\S]*?<script>/, '').replace(/<\/script>\s*$/, '');
new Function(body);

const calls = [];
const heights = [300, 300, 420, 300, 420];
let at = 0;
const sandbox = {
    AndroidBridge: { updateSize: h => calls.push(h) },
    document: {
        readyState: 'complete',
        documentElement: { get scrollHeight() { return heights[Math.min(at, heights.length - 1)] } },
        body: { get scrollHeight() { return heights[Math.min(at, heights.length - 1)] }, offsetHeight: 0 },
        addEventListener() {}
    },
    addEventListener() {},
    setTimeout: fn => fn(),
    clearTimeout() {},
    ResizeObserver: undefined,
    Math
};
sandbox.window = sandbox;

const run = new Function('window', 'document', 'addEventListener', 'setTimeout', 'clearTimeout', 'ResizeObserver', body);
run(sandbox, sandbox.document, sandbox.addEventListener, sandbox.setTimeout, sandbox.clearTimeout, undefined);

assert.deepEqual(calls, [300], 'first measurement reports once');
