import { proxyReady } from './proxy';
import settings from './settings';
import protocol from './protocol';
import pageAction from './page-action';

// initialise proxy pac file
proxyReady.then(() => {
    // get gatewayaddress from settings
    settings.load();
    // register listeners for urls which should be handled by the dat protocol
    protocol.init();
    // register listener the page action which will do dat-dns lookups to discover dat sites
    pageAction.init();
});
