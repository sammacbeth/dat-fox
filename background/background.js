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
    useNativeBridge(bridge.api);
    const port = 3000 + Math.floor(Math.random() * 500);
    await bridge.api.startGateway({ port });
    setGatewayAddress(`http://localhost:${port}`);
    // add actions which the helper API supports
    ['resolveName', 'getInfo', 'stat', 'readdir', 'history', 'readFile', 'writeFile', 'mkdir', 
        'unlink', 'rmdir', 'diff', 'commit', 'revert', 'download', 'createFileActivityStream',
        'createNetworkActivityStream', 'pollActivityStream', 'closeActivityStream', 'configure',
        'copy', 'rename']
        .forEach((action) => {
            passthroughActions.add(action);
        });
    // manage open archives
    setInterval(async () => {
        const library = new Set((await bridge.api.listLibrary()).map(({ url }) => url));
        const archives = await bridge.api.getOpenArchives();
        // 5 mins inactivity -> close
        const ageCutoff = Date.now() - (5 * 60 * 1000);
        const closeArchives = archives.filter(({ url, lastUsed }) => !library.has(url) && lastUsed < ageCutoff);
        if (closeArchives.length > 0) {
            console.log('closing dats:', closeArchives.map(({ url }) => url));
            await closeArchives.map(({ url }) => bridge.api.closeArchive({ url }));
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
        const { uuid, action, args } = message;
        if (passthroughActions.has(action)) {
            bridge.api[action](...args).then(
                response => ({ uuid, action, response }),
                error => ({ uuid, action, error })
            ).then(response => {
                port.postMessage(response);
            });
        } else if (handlers[action]) {
            handlers[action](message).then((response) => {
                port.postMessage({
                    uuid,
                    action,
                    response,
                });
            }, (error) => {
                port.postMessage({
                    uuid,
                    action,
                    error: error,
                });
            });
        } else {
            port.postMessage({
                uuid,
                error: 'unsupported action',
            });
        }
    });
});
