
// detect www sites which publish a dat version
// TODO should probably rely on dat-dns for this.
export const wellKnownCache = new Map();

function init() {
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
}

export function showDatSecureIcon(tabId) {
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

export function showDatAvailableIcon(tabId) {
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

export default {
    init,
}