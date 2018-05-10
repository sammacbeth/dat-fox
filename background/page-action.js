// detect www sites which publish a dat version
// TODO should probably rely on dat-dns for this.
import { datSites, removeDatSite } from './sites';
import datApis from './dat-apis';


function init() {
    browser.webRequest.onCompleted.addListener((details) => {
        const host = details.url.split('/')[2];
        datApis.DatArchive.resolveName(host).then((wellKnown) => {
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
    browser.pageAction.setPopup({ tabId, popup: 'popup/popup.html' });
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
    browser.pageAction.setPopup({ tabId, popup: '' });
    browser.pageAction.show(tabId);
}

// Page action for dat enabled sites: reloads the page over dat.
browser.pageAction.onClicked.addListener((tab) => {
    const [protocol, , host] = tab.url.split('/');
    datApis.DatArchive.resolveName(host).then((wellKnown) => {
        if (!wellKnown) {
            return;
        }
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
    });
});

export default {
    init,
};
