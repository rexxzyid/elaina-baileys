/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { assertNodeErrorFree } from '../../WABinary/index.js';
export class USyncUsernameProtocol {
    constructor() {
        this.name = 'username';
    }
    getQueryElement() {
        return {
            tag: 'username',
            attrs: {}
        };
    }
    getUserElement(user) {
        void user;
        return null;
    }
    parser(node) {
        if (node.tag === 'username') {
            assertNodeErrorFree(node);
            return typeof node.content === 'string' ? node.content : null;
        }
        return null;
    }
}
