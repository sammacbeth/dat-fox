
const datSites = new Set();
const datUrlMatcher = /^[0-9a-f]{64}$/

browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'add') {
        datSites.add(message.host)
        browser.runtime.sendMessage(`dat sites are now: ${[...datSites]}`);
    } else if (message.action === 'remove') {
        datSites.delete(message.host);
        browser.runtime.sendMessage(`dat sites are now: ${[...datSites]}`);
    }
});

function FindProxyForURL(url, host) {
    if (url.startsWith('https')) {
        return 'DIRECT';
    }

    if (datSites.has(host) || datUrlMatcher.test(host)) {
        browser.runtime.sendMessage(`loading url over dat: ${url}`);
        return [{
            type: 'http',
            host: 'localhost',
            port: 3000,
        }];
    }
    return 'DIRECT';
}