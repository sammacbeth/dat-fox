/**
 * Handles persistent user settings. These are
 *  * user configured gateway address
 */
import { setGatewayAddress } from './proxy';

export default {
    load() {
        // read settings for gateway
        browser.storage.local.get('gatewayAddress').then((res) => {
            if (res.gatewayAddress) {
                setGatewayAddress(res.gatewayAddress);
            }
        });

        browser.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local' && changes.gatewayAddress) {
                setGatewayAddress(changes.gatewayAddress.newValue);
            }
        });
    }
};
