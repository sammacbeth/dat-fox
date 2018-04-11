const pacFile = 'pac.js';
const pacFileUrl = browser.extension.getURL(pacFile);

// in order to create a valid origin for dat sites we need to 'invent'
// hostnames for them. We can do this via a pac file which proxies requests
// for domains we want to serve over dat to the dat-gateway. This hack allows
// us to create hostnames on the fly.
export let proxyReady = browser.proxy.register(pacFile);

// log messages from the pac file
browser.runtime.onMessage.addListener((message, sender) => {
    if (sender.url === pacFileUrl) {
        console.log('[PAC]', message);
    }
});

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
    browser.runtime.sendMessage(message, { toProxyScript: true });
}