
const datSites = new Set();
const datUrlMatcher = /^[0-9a-f]{64}(\+[0-9]+)?$/

browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'add') {
        datSites.add(message.host)
        browser.runtime.sendMessage(`dat sites are now: ${[...datSites]}`);
    }
});

function FindProxyForURL(url, host) {
    const [domain, verion] = host.split('+');
    if (datSites.has(domain) || datUrlMatcher.test(host)) {
        browser.runtime.sendMessage(`loading url over dat: ${url}`);
        return [{
            type: 'http',
            host: 'localhost',
            port: 3000,
        }];
    }
    return 'DIRECT';
}