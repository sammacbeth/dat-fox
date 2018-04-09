
const datSites = new Set();
const datUrlMatcher = /^[0-9a-f]{64}$/;

let type = 'http';
let proxyHost = 'localhost';
let port = 3000;

browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'add') {
        datSites.add(message.host)
        browser.runtime.sendMessage(`dat sites are now: ${[...datSites]}`);
    } else if (message.action === 'remove') {
        datSites.delete(message.host);
        browser.runtime.sendMessage(`dat sites are now: ${[...datSites]}`);
    } else if (message.action === 'setGateway') {
        type = message.type;
        proxyHost = message.host;
        port = message.port;
    }
});

function FindProxyForURL(url, host) {
    if (url.startsWith('https')) {
        return 'DIRECT';
    }

    if (datSites.has(host) || datUrlMatcher.test(host)) {
        browser.runtime.sendMessage(`loading url over dat: ${url} via ${type}://${proxyHost}:${port}`);
        return [{
            type,
            host: proxyHost,
            port,
        }];
    }
    return 'DIRECT';
}