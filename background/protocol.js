/**
 * Sets up redirects for dat:// urls to be proxied.
 */
// import mime from 'mime';
import parseUrl from 'parse-dat-url';
import mime from 'mime';
import { addDatSite, datSites } from './sites';
import { showDatSecureIcon } from './page-action';

const datUrlMatcher = /^[0-9a-f]{64}(\+[0-9]+)?$/;
let gatewayUrl = 'http://localhost:3000';

export function setGatewayAddress(addr) {
    gatewayUrl = addr;
}

function init() {
    browser.protocol.registerProtocol('dat', (request) => {
        const { pathname } = parseUrl(request.url);
        let reader = null;
        return {
            contentType: mime.getType(decodeURIComponent(pathname)) || 'text/html',
            content: {
                async next() {
                    if (reader) {
                        // already streaming
                        const { done, value } = await reader.read();
                        return { done, value: value ? value.buffer : undefined };
                    }
                    const gatewayRequest = await fetch(`${gatewayUrl}/${request.url}`);
                    if (gatewayRequest.ok) {
                        if (gatewayRequest.body) {
                            // request supports streaming
                            reader = gatewayRequest.body.getReader();
                            const { done, value } = await reader.read();
                            return { done, value: value.buffer };
                        }
                        const buffer = await gatewayRequest.arrayBuffer();
                        return {
                            done: true,
                            value: buffer,
                        }
                    }
                    return {
                        done: true,
                        value: new ArrayBuffer(),
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
        } else if (changeInfo.url && changeInfo.url.startsWith('dat:')) {
            showDatSecureIcon(tabId);
        }
    });
}

export default {
    init,
};
