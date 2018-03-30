
const pacFile = 'pac.js';
const pacFileUrl = browser.extension.getURL(pacFile);
const datSites = new Set(['beakerbrowser.com']);
const datUrlMatcher = /^[0-9a-f]{64}$/

// in order to create a valid origin for dat sites we need to 'invent'
// hostnames for them. We can do this via a pac file which proxies requests
// for domains we want to serve over dat to the dat-gateway. This hack allows
// us to create hostnames on the fly.
browser.proxy.register(pacFile).then(() => {
    // instruct pac script to proxy these hosts
    datSites.forEach((host) => {
        addDatSite(host);
    });    
});

// log messages from the pac file
browser.runtime.onMessage.addListener((message, sender) => {
    if (sender.url === pacFileUrl) {
        console.log('[PAC]', message);
    }
});

function switchToDatProtocol(details) {
    // downgrade requests to get dat version
    return {
        redirectUrl: details.url.replace('https://', 'http://'),
    }
}

function addDatSite(host) {
    console.log('add dat site', host);
    datSites.add(host);
    browser.runtime.sendMessage({
        action: 'add',
        host,
    }, { toProxyScript: true });
    browser.webRequest.onBeforeRequest.removeListener(switchToDatProtocol);
    browser.webRequest.onBeforeRequest.addListener(switchToDatProtocol, {
        urls: [...datSites].map(host => `https://${host}/*`),
    }, ['blocking']);
}


browser.webRequest.onBeforeRequest.addListener((details) => {
    // replace url encoded dat:// prefix
    const datUrl = decodeURIComponent(details.url.replace('http://dat.redirect/?dat%3A%2F%2F', ''));
    const hostOrAddress = datUrl.split('/')[0];

    // if its a plain dat url, just do the redirect
    if (datUrlMatcher.test(hostOrAddress)) {
        return {
            redirectUrl: `http://${datUrl}`,
        }
    }
    // otherwise, we need to add this hostname to the list of dat sites
    // TODO this will trigger a race condition
    addDatSite(hostOrAddress);
    return {
        redirectUrl: `http://${datUrl}`,
    }
}, {
    urls: [`http://dat.redirect/*`],
}, ['blocking']);
