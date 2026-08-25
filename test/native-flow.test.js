import assert from 'node:assert/strict';
import {
    NATIVE_FLOW_BUTTON_LIMIT,
    NATIVE_FLOW_NAMES,
    checkNativeFlowButtons,
    getNativeFlowNameByButtonName,
    isWebSupportedButtonName
} from '../lib/Utils/native-flow.js';

assert.equal(NATIVE_FLOW_NAMES.includes('single_select'), false);
assert.equal(NATIVE_FLOW_NAMES.includes('send_location'), false);
assert.equal(NATIVE_FLOW_NAMES.includes('quick_reply'), true);

assert.equal(getNativeFlowNameByButtonName('single_select'), undefined);
assert.equal(getNativeFlowNameByButtonName('review_and_pay'), 'order_details');
assert.equal(getNativeFlowNameByButtonName('open_webview'), 'message_with_link');

assert.equal(isWebSupportedButtonName('quick_reply'), true);
assert.equal(isWebSupportedButtonName('cta_url'), true);
assert.equal(isWebSupportedButtonName('single_select'), false);
assert.equal(isWebSupportedButtonName('review_and_pay'), false);

const selection = checkNativeFlowButtons([{ name: 'single_select' }]);
assert.equal(selection.ok, false);
assert.deepEqual(selection.unsupported, ['single_select']);

const tooManyReplies = checkNativeFlowButtons(new Array(NATIVE_FLOW_BUTTON_LIMIT.quickReply + 1).fill({ name: 'quick_reply' }));
assert.equal(tooManyReplies.ok, false);
assert.equal(tooManyReplies.limit, NATIVE_FLOW_BUTTON_LIMIT.quickReply);

const atLimit = checkNativeFlowButtons(new Array(NATIVE_FLOW_BUTTON_LIMIT.quickReply).fill({ name: 'quick_reply' }));
assert.equal(atLimit.ok, true);

const tooManyCtas = checkNativeFlowButtons(new Array(NATIVE_FLOW_BUTTON_LIMIT.other + 1).fill({ name: 'cta_url' }));
assert.equal(tooManyCtas.ok, false);
assert.equal(tooManyCtas.limit, NATIVE_FLOW_BUTTON_LIMIT.other);

const mixed = checkNativeFlowButtons([{ name: 'quick_reply' }, { name: 'cta_url' }]);
assert.equal(mixed.ok, false);

assert.equal(checkNativeFlowButtons([{ name: 'cta_url' }, { name: 'cta_call' }]).ok, true);
assert.equal(checkNativeFlowButtons([]).ok, true);
assert.equal(checkNativeFlowButtons(['cta_copy']).ok, true);

console.log('native flow tests passed');
