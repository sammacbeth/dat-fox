
const pacFile = 'pac.js';
const pacFileUrl = browser.extension.getURL(pacFile);
const datSites = new Set();
const datUrlMatcher = /^[0-9a-f]{64}(\+[0-9]+)?$/

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

/**
 * Add a site which should be loaded over dat instead of https. Instructs the pac file to proxy
 * requests to this host via the dat-gateway, and to downgrade any requests to https address for 
 * this site, so the proxying can work.
 */
function addDatSite(host) {
    console.log('add dat site', host);
    datSites.add(host);
    browser.runtime.sendMessage({
        action: 'add',
        host,
    }, { toProxyScript: true });
    registerDowngradeHandler();
}

function removeDatSite(host) {
    console.log('remove dat site', host);
    datSites.delete(host);
    browser.runtime.sendMessage({
        action: 'remove',
        host,
    }, { toProxyScript: true });
    registerDowngradeHandler();
}

function registerDowngradeHandler() {
    browser.webRequest.onBeforeRequest.removeListener(switchToDatProtocol);
    if (datSites.size > 0) {
        browser.webRequest.onBeforeRequest.addListener(switchToDatProtocol, {
            urls: [...datSites].map(host => `https://${host}/*`),
        }, ['blocking']);
    }
}

/*
 * Listen for requests to a fake redirect host (dat.redirect), and redirect to a url which will be
 * proxied to the dat-gateway.
 */
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
    urls: ['http://dat.redirect/*'],
}, ['blocking']);

// change dat:// urls to http:// in html documents because protocol handlers do not work on
// third-party calls
browser.webRequest.onHeadersReceived.addListener((details) => {
    const host = details.url.split('/')[2];

    if (datSites.has(host) || datUrlMatcher.test(host)) {
        const filter = browser.webRequest.filterResponseData(details.requestId);
        const decoder = new TextDecoder("utf-8");
        const encoder = new TextEncoder();
        filter.ondata = event => {
            const content = decoder.decode(event.data, {stream: true});
            filter.write(encoder.encode(content.replace(/dat\:\/\//g, 'http://')))
        }
        // trigger page_action for dat pages
        setTimeout(() => {
            showDatSecureIcon(details.tabId);
        }, 200);
    }
}, {
    urls: ['http://*/*'],
    types: ['main_frame', 'sub_frame']
}, ["blocking"]);

function showDatSecureIcon(tabId) {
    browser.pageAction.setIcon({
        tabId,
        path: 'assets/dat-hexagon.svg',
    });
    browser.pageAction.setTitle({
        tabId,
        title: 'Secure Dat Site',
    });
    browser.pageAction.show(tabId);
}

function showDatAvailableIcon(tabId) {
    browser.pageAction.setIcon({
        tabId,
        path: 'assets/dat-hexagon-blue.svg',
    });
    browser.pageAction.setTitle({
        tabId,
        title: 'Dat Version Available',
    });
    browser.pageAction.show(tabId);
}

// detect www sites which publish a dat version
// TODO should probably rely on dat-dns for this.
const wellKnownCache = new Map();
browser.webRequest.onCompleted.addListener((details) => {
    const host = details.url.split('/')[2];
    console.log('host', host);
    (new Promise((resolve) => {
        if (wellKnownCache.has(host)) {
            resolve(Promise.resolve(wellKnownCache.get(host)));
        }
        fetch(`https://${host}/.well-known/dat`, { redirect: 'manual' }).then((resp) => {
            if (resp.ok) {
                return resp.text().then(text => {
                    try {
                        return /^dat:\/\/([0-9a-f]{64})/i.test(text.split('/n')[0]);
                    } catch(e) {
                        return false
                    }
                })
            }
            return false;
        }).then(resolve);
    })).then((wellKnown) => {
        wellKnownCache.set(host, wellKnown);
        if (wellKnown) {
            showDatAvailableIcon(details.tabId);
        }
    });
}, {
    urls: ['https://*/*'],
    types: ['main_frame'],
});

// Page action for dat enabled sites: reloads the page over dat.
browser.pageAction.onClicked.addListener((tab) => {
    const [protocol, _, host] = tab.url.split('/');
    if (wellKnownCache.get(host) === true) {
        // flush browser cache for redirects
        browser.webRequest.handlerBehaviorChanged().then(() => {
            if (protocol === 'https:') {
                // current protocol is https: switch to dat
                console.log(host, 'switch to https');
                browser.tabs.update(tab.id,
                    {
                        url: tab.url.replace('https://', 'dat://'),
                    }
                );
            } else if (protocol === 'http:' && datSites.has(host)) {
                // already on dat, switch back to http
                console.log(host, 'switch to https');
                removeDatSite(host);
                browser.tabs.update(tab.id,
                    {
                        url: tab.url.replace('http://', 'https://'),
                    }
                );
            }
        });
    }
});