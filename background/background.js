import { proxyReady, setGatewayAddress } from './proxy';
import settings from './settings';
import protocol from './protocol';
import pageAction from './page-action';
import NativeBridge from './native-bridge';
import datApis, { useNativeBridge } from './dat-apis';
import { addDatSite } from './sites';
import dialog from './dialog';

// initialise proxy pac file
proxyReady.then(() => {
    // get gatewayaddress from settings
    settings.load();
    // register listeners for urls which should be handled by the dat protocol
    protocol.init();
    pageAction.init();
});

const bridge = new NativeBridge();
global.bridge = bridge;
global.resetBridge = async () => {
    if (bridge.connected) {
        bridge.disconnect();
    }
    await bridge.connect();
    console.log('bridge is ready');
    useNativeBridge(bridge);
    const port = 3000 + Math.floor(Math.random() * 500);
    await bridge.postMessage({
        action: 'startGateway',
        port: port,
    });
    setGatewayAddress(`http://localhost:${port}`);
    // add actions which the helper API supports
    ['resolveName', 'getInfo', 'stat', 'readdir', 'history', 'readFile', 'writeFile', 'mkdir', 
        'unlink', 'rmdir', 'diff', 'commit', 'revert', 'download', 'createFileActivityStream',
        'createNetworkActivityStream', 'pollActivityStream', 'closeActivityStream']
        .forEach((action) => {
            passthroughActions.add(action);
        });
    // manage open archives
    setInterval(async () => {
        const library = new Set((await bridge.postMessage({ action: 'listLibrary' })).map(({ url }) => url));
        const archives = await bridge.postMessage({ action: 'getOpenArchives' });
        // 5 mins inactivity -> close
        const ageCutoff = Date.now() - (5 * 60 * 1000);
        const closeArchives = archives.filter(({ url, lastUsed }) => !library.has(url) && lastUsed < ageCutoff);
        if (closeArchives.length > 0) {
            console.log('closing dats:', closeArchives.map(({ url }) => url));
            await closeArchives.map(({ url }) => bridge.postMessage({ action: 'closeArchive', url }));
        }
    }, 60000);
    return port;
};

global.resetBridge().catch((e) => {
    console.log('bridge loading failed, using local Dat API implementation', e);
    console.log('opening setup page');
    browser.tabs.create({ url: browser.extension.getURL('pages/setup.html')});
});


// actions in this set are forwarded to the native bridge
const passthroughActions = new Set();

// local handlers for actions from content script
const handlers = {
    resolveName: (message) => datApis.DatArchive.resolveName(message.name),
    addDatSite: (message) => addDatSite(message.host),
    create: (message) => dialog.open(message),
    fork: (message) => dialog.open(message),
    selectArchive: (message) => dialog.open(message),
    dialogResponse: (message) => dialog.onMessage(message),
};

browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((message) => {
        const { id, action } = message;
        if (passthroughActions.has(action)) {
            bridge.postMessage(message).then(
                result => ({ id, result }),
                error => ({ id, error })
            ).then(response => {
                port.postMessage(response);
            });
        } else if (handlers[action]) {
            handlers[action](message).then((result) => {
                port.postMessage({
                    id,
                    action,
                    result,
                });
            }, (error) => {
                port.postMessage({
                    id,
                    action,
                    error: error,
                });
            });
        } else {
            port.postMessage({
                id,
                error: 'unsupported action',
            });
        }
    });
});
