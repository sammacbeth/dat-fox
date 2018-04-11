/**
 * Handles dat sites (domains mapped to dat addresses).
 */
import { sendMessageToPAC } from './proxy';
import datApis from './dat-apis';

export const datSites = new Set();

/**
 * Add a site which should be loaded over dat instead of https. Instructs the pac file to proxy
 * requests to this host via the dat-gateway, and to downgrade any requests to https address for 
 * this site, so the proxying can work.
 */
export function addDatSite(host) {
    console.log('add dat site', host);
    datSites.add(host);
    sendMessageToPAC({
        action: 'add',
        host,
    });
    registerDowngradeHandler();
}

export function removeDatSite(host) {
    console.log('remove dat site', host);
    datSites.delete(host);
    sendMessageToPAC({
        action: 'remove',
        host,
    });
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

const requestCtr = new Set();
setInterval(() => {
    requestCtr.clear();
}, 30000);

function switchToDatProtocol(details) {
    // detect a repeated requestId through this handler. This means that the browser is preventing
    // the downgrade. In this case, we redirect to the full dat address to prevent an infinite
    // redirect
    if (requestCtr.has(details.requestId)) {
        const [,, host, path] = details.url.split('/', 4);
        return datApis.DatArchive.resolveName(host).then((address) => {
            return {
                redirectUrl: `dat://${address}/${path}`,
            };
        });
    }
    requestCtr.add(details.requestId);
    // downgrade requests to get dat version
    return {
        redirectUrl: details.url.replace('https://', 'http://'),
    };
}
