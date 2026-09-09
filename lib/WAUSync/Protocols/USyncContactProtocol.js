/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { assertNodeErrorFree } from '../../WABinary/index.js';
export class USyncContactProtocol {
    constructor() {
        this.name = 'contact';
    }
    getQueryElement() {
        return {
            tag: 'contact',
            attrs: {}
        };
    }
    getUserElement(user) {
        if (user.phone) {
            return {
                tag: 'contact',
                attrs: {},
                content: user.phone
            };
        }
        if (user.username) {
            return {
                tag: 'contact',
                attrs: {
                    username: user.username,
                    ...(user.usernameKey ? { pin: user.usernameKey } : {}),
                    ...(user.lid ? { lid: user.lid } : {})
                }
            };
        }
        if (user.type) {
            return {
                tag: 'contact',
                attrs: {
                    type: user.type
                }
            };
        }
        return {
            tag: 'contact',
            attrs: {}
        };
    }
    parser(node) {
        if (node.tag === 'contact') {
            assertNodeErrorFree(node);
            return node?.attrs?.type === 'in';
        }
        return false;
    }
}
