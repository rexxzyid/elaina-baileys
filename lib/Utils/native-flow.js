/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export const NATIVE_FLOW_NAMES = Object.freeze([
    'booking_confirmation',
    'order_details',
    'order_status',
    'payment_status',
    'payment_method',
    'payment_reminder',
    'message_with_link',
    'message_with_link_status',
    'quick_reply',
    'cta_call',
    'cta_url',
    'cta_catalog',
    'catalog_message',
    'payment_info',
    'cta_copy',
    'mixed',
    'galaxy_message',
    'cta_app',
    'call_permission_request',
    'payment_request',
    'api_signup',
    'inapp_signup',
    'form_message',
    'menu_options',
    'a2ui_reply_action'
])

const BUTTON_NAME_TO_FLOW = Object.freeze({
    review_and_pay: 'order_details',
    payment_info: 'payment_info',
    review_order: 'order_status',
    order_status: 'order_status',
    payment_status: 'payment_status',
    payment_method: 'payment_method',
    open_webview: 'message_with_link',
    message_with_link_status: 'message_with_link_status',
    cta_url: 'cta_url',
    cta_call: 'cta_call',
    quick_reply: 'quick_reply',
    catalog_message: 'catalog_message',
    cta_catalog: 'cta_catalog',
    cta_copy: 'cta_copy',
    galaxy_message: 'galaxy_message',
    payment_reminder: 'payment_reminder',
    booking_confirmation: 'booking_confirmation',
    call_permission_request: 'call_permission_request',
    payment_request: 'payment_request',
    api_signup: 'api_signup',
    inapp_signup: 'inapp_signup',
    cta_app: 'cta_app',
    form_message: 'form_message'
})

export const WEB_SUPPORTED_INTERACTIVE_FLOWS = Object.freeze([
    'quick_reply',
    'cta_call',
    'cta_url',
    'cta_catalog',
    'catalog_message',
    'cta_copy',
    'galaxy_message',
    'order_status',
    'payment_reminder',
    'booking_confirmation',
    'payment_request',
    'api_signup',
    'inapp_signup',
    'cta_app',
    'form_message'
])

export const NATIVE_FLOW_BUTTON_LIMIT = Object.freeze({
    quickReply: 10,
    other: 3
})

export const getNativeFlowNameByButtonName = (name) => BUTTON_NAME_TO_FLOW[name]

export const isWebSupportedButtonName = (name) => {
    const flow = getNativeFlowNameByButtonName(name)
    return flow !== undefined && WEB_SUPPORTED_INTERACTIVE_FLOWS.includes(flow)
}

export const checkNativeFlowButtons = (buttons) => {
    const list = (Array.isArray(buttons) ? buttons : []).map(button => (typeof button === 'string' ? { name: button } : button))
    const problems = []

    if (!list.length) {
        return { ok: true, limit: NATIVE_FLOW_BUTTON_LIMIT.other, problems, unsupported: [] }
    }

    const firstIsQuickReply = list[0]?.name === 'quick_reply'
    const limit = firstIsQuickReply ? NATIVE_FLOW_BUTTON_LIMIT.quickReply : NATIVE_FLOW_BUTTON_LIMIT.other

    if (list.length > limit) {
        problems.push(`WhatsApp Web renders at most ${limit} buttons when the first one is ${firstIsQuickReply ? 'quick_reply' : 'not quick_reply'}, got ${list.length}`)
    }

    const unsupported = [...new Set(list.map(button => button?.name).filter(name => !isWebSupportedButtonName(name)))]
    for (const name of unsupported) {
        problems.push(`"${name}" is not a native flow WhatsApp Web or iOS can render, only Android shows it`)
    }

    const mixesKinds = list.slice(1).some(button => (button?.name === 'quick_reply') !== firstIsQuickReply)
    if (mixesKinds) {
        problems.push('quick_reply buttons cannot be mixed with other button types in one message')
    }

    return { ok: problems.length === 0, limit, problems, unsupported }
}
