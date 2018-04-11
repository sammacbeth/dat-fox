/**
 * Handles dat sites (domains mapped to dat addresses).
 */
import { sendMessageToPAC } from './proxy';

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

function switchToDatProtocol(details) {
    // downgrade requests to get dat version
    return {
        redirectUrl: details.url.replace('https://', 'http://'),
    }
}
