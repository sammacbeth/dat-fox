import { proxyReady, setGatewayAddress } from './proxy';
import settings from './settings';
import protocol from './protocol';
import pageAction from './page-action';
import NativeBridge from './native-bridge';
import datApis, { useNativeBridge } from './dat-apis';
import { addDatSite } from './sites';

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
bridge.connect().then(() => {
    console.log('bridge is ready');
    useNativeBridge(bridge);
    const port = 3000 + Math.floor(Math.random() * 500);
    bridge.postMessage({
        action: 'startGateway',
        port: port,
    }).then(() => {
        setGatewayAddress(`http://localhost:${port}`);
    }, (e) => console.error('error starting gateway', e));
    // add actions which the helper API supports
    ['resolveName', 'getInfo', 'stat', 'readdir', 'history', 'readFile', 'writeFile', 'mkdir', 
        'unlink', 'rmdir', 'diff', 'commit', 'revert', 'download', 'createFileActivityStream',
        'createNetworkActivityStream', 'pollActivityStream', 'closeActivityStream']
        .forEach((action) => {
            passthroughActions.add(action);
        });
}, (e) => {
    console.log('bridge loading failed, using local Dat API implementation', e);
});

// actions in this set are forwarded to the native bridge
const passthroughActions = new Set();
const dialogs = new Map();
// local handlers for actions from content script
const handlers = {
    resolveName: (message) => datApis.DatArchive.resolveName(message.name),
    addDatSite: (message) => addDatSite(message.host),
    create: async (message) => {
        const win = await browser.windows.create({
            allowScriptsToClose: true,
            type: 'panel',
            url: `/dialog.html#${JSON.stringify(message)}`,
            width: 500,
            height: 250,
        })
        return new Promise((resolve, reject) => {
            dialogs.set(message.id, { resolve, reject });
        });
    },
    dialogResponse: ({ dialogId, result, error }) => {
        if (error) {
            dialogs.get(dialogId).reject(error);
        } else {
            dialogs.get(dialogId).resolve(result);
        }
        dialogs.delete(dialogId);
        return Promise.resolve();
    }
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