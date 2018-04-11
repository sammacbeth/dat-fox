
export default class {

    constructor() {
        this.messageIdx = 0;
        this.waitingForResponse = new Map();
    }

    connect() {
        this.port = browser.runtime.connectNative("datbridge");
        this.port.onMessage.addListener(this.onMessage.bind(this));
        
        return new Promise((resolve, reject) => {
            // wait 2s to see if launch of the subprocess was successful
            const disconnectListener = (p) => {
                clearTimeout(timer);
                reject(p.error);
            };
            const timer = setTimeout(() => {
                this.port.onDisconnect.removeListener(disconnectListener);
                resolve()
            }, 2000);
            this.port.onDisconnect.addListener(disconnectListener);
        });
    }

    onMessage(response) {
        console.log("Received: " + JSON.stringify(response));
        if (this.waitingForResponse.has(response.id)) {
            const { resolve, reject } = this.waitingForResponse.get(response.id);
            this.waitingForResponse.delete(response.id);
            if (response.error) {
                reject(response.error);
            } else {
                resolve(response.result);
            }
        }
    }

    postMessage(message) {
        console.log('send', message);
        return new Promise((resolve, reject) => {
            message.id = this.messageIdx++;
            this.waitingForResponse.set(message.id, {
                resolve,
                reject,
            });
            this.port.postMessage(message);
        });
    };
};
