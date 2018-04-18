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
    ['resolveName', 'getInfo', 'stat', 'readdir', 'history', 'readFile']
        .forEach((action) => {
            passthroughActions.add(action);
        });
}, (e) => {
    console.log('bridge loading failed, using local Dat API implementation', e);
});

// actions in this set are forwarded to the native bridge
const passthroughActions = new Set();
// local handlers for actions from content script
const handlers = {
    resolveName: (message) => datApis.DatArchive.resolveName(message.name),
    addDatSite: (message) => addDatSite(message.host),
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