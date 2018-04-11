import { proxyReady, setGatewayAddress } from './proxy';
import settings from './settings';
import protocol from './protocol';
import pageAction from './page-action';
import NativeBridge from './native-bridge';
import { useNativeBridge } from './dat-apis';

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
    bridge.postMessage({
        action: 'startGateway',
        port: 3000,
    }).then(() => {
        setGatewayAddress('http://localhost:3000');
    }, (e) => console.error('error starting gateway', e));
}, (e) => {
    console.log('bridge loading failed, using local Dat API implementation', e);
});
