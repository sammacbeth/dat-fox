/**
 * Sets up redirects for dat:// urls to be proxied.
 */
// import mime from 'mime';
import parseUrl from 'parse-dat-url';
import { addDatSite, datSites } from './sites';
import { showDatSecureIcon } from './page-action';

const datUrlMatcher = /^[0-9a-f]{64}(\+[0-9]+)?$/;
let gatewayUrl = 'http://localhost:3000';

export function setGatewayAddress(addr) {
    gatewayUrl = addr;
}

function init() {
    browser.protocol.registerProtocol('dat', (request) => {
        const { host, pathname } = parseUrl(request.url);
        return {
            contentType: mime.getType(decodeURIComponent(pathname)) || 'text/html',
            content: {
                async next() {
                    const contentBlob = await (await fetch(`${gatewayUrl}/${request.url}`)).blob();
                    const buffer = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve(reader.result);
                        }
                        reader.readAsArrayBuffer(contentBlob);
                    });
                    return {
                        done: true,
                        value: buffer,
                    }
                }
            }
        };
    });

    // trigger dat secure page action for dat pages
    browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo.url && changeInfo.url.startsWith('http')) {
            const host = changeInfo.url.split('/')[2];
            if (datSites.has(host) || datUrlMatcher.test(host)) {
                showDatSecureIcon(tabId);
            }
        }
    });
}

export default {
    init,
};
