const pacFile = 'pac.js';
const pacFileUrl = browser.extension.getURL(pacFile);
const proxyOnRequestAvailable = !!browser.proxy.onRequest;
const datSites = new Set();
const datUrlMatcher = /^[0-9a-f]{64}$/;
const proxyInfo = {
    type: 'http',
    host: 'localhost',
    port: 3000,
};

// in order to create a valid origin for dat sites we need to 'invent'
// hostnames for them. We can do this via a pac file which proxies requests
// for domains we want to serve over dat to the dat-gateway. This hack allows
// us to create hostnames on the fly.
export let proxyReady = proxyOnRequestAvailable ? Promise.resolve() : browser.proxy.register(pacFile);

if (proxyOnRequestAvailable) {
    browser.proxy.onRequest.addListener((details) => {
        const { host } = new URL(details.url);
        if (datSites.has(host) || datUrlMatcher.test(host)) {
            console.log(`loading url over dat: ${details.url} via ${proxyInfo.type}://${proxyInfo.host}:${proxyInfo.port}`);
            return proxyInfo;
        }
    }, { 'urls': ['http://*/*']} );
} else {
    // log messages from the pac file
    browser.runtime.onMessage.addListener((message, sender) => {
        if (sender.url === pacFileUrl) {
            console.log('[PAC]', message);
        }
    });
}

export function setGatewayAddress(address) {
    const addressRegex = /(https?):\/\/([^/?:]+)(:[0-9]+)?/;
    let [, type, host, port] = address.match(addressRegex);
    if (!port) {
        port = type === 'https' ? 443 : 80;
    } else {
        port = Number(port.substring(1));
    }
    console.log('update gateway address to', type, host, port);
    sendMessageToPAC({
        action: 'setGateway',
        type,
        host,
        port,
    });
}

export function sendMessageToPAC(message) {
    if (proxyOnRequestAvailable) {
        if (message.action === 'add') {
            datSites.add(message.host);
        } else if (message.action === 'remove') {
            datSites.delete(message.host);
        } else if (message.action === 'setGateway') {
            proxyInfo.type = message.type;
            proxyInfo.host = message.host;
            proxyInfo.port = message.port;
        }
    } else {
        browser.runtime.sendMessage(message, { toProxyScript: true });
    }
}