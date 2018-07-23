import Spanan from 'spanan';

function wrapMessage(message) {
    const compatMessage = {
        action: message.action,
        id: message.uuid,
    };
    if (message.args && message.args[0]) {
        const args = message.args[0];
        Object.keys(args).forEach((k) => {
            compatMessage[k] = args[k];
        });
    }
    return compatMessage;
}

function unwrapMessage(message) {
    message.uuid = message.id;
    if (message.result) {
        message.response = message.result;
    } else if (!message.error) {
        message.response = undefined;
    }
    return message;
}

export default class {

    constructor() {
        this.connected = false;
    }

    connect() {
        this.port = browser.runtime.connectNative('dathelper');
        this.messageWrapper = new Spanan((message) => {
            this.port.postMessage(wrapMessage(message));
        });
        this.port.onMessage.addListener((message) => {
            this.messageWrapper.handleMessage(unwrapMessage(message));
        });
        this.api = this.messageWrapper.createProxy();
        
        return new Promise((resolve, reject) => {
            // wait 2s to see if launch of the subprocess was successful
            const disconnectListener = (p) => {
                clearTimeout(timer);
                reject(p.error);
            };
            const timer = setTimeout(() => {
                this.port.onDisconnect.removeListener(disconnectListener);
                this.connected = true;
                resolve();
            }, 2000);
            this.port.onDisconnect.addListener(disconnectListener);
        });
    }

    disconnect() {
        this.connected = false;
        this.port.disconnect();
    }
}
