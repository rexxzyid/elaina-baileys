/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { EventEmitter } from 'events';
export class AbstractSocketClient extends EventEmitter {
    constructor(url, config) {
        super();
        this.url = url;
        this.config = config;
        this.setMaxListeners(0);
    }
}
