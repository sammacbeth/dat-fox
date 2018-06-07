/* global _datfoxPostMessage, _datfoxAddListener */
import createDatArchiveApi from '../common/dat-archive-rpc';
import urlParse from 'url-parse';

(function (window) {
    let messageIdx = 0;
    const waitingForResponse = new Map();

    function postMessage(message) {
        console.log('send', message);
        return new Promise((resolve, reject) => {
            message.id = messageIdx++;
            waitingForResponse.set(message.id, {
                resolve,
                reject,
            });
            _datfoxPostMessage(message);
        });
    }

    _datfoxAddListener((responseJSON) => {
        const response = JSON.parse(responseJSON);
        console.log('Received: ', response);
        if (waitingForResponse.has(response.id)) {
            const { resolve, reject } = waitingForResponse.get(response.id);
            waitingForResponse.delete(response.id);
            if (response.error) {
                reject(response.error);
            } else {
                resolve(response.result);
            }
        }
    });

    window.DatArchive = createDatArchiveApi({ postMessage });

    window.URL = urlParse;

})(window);