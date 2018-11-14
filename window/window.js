import createDatArchiveApi from '../common/dat-archive-rpc';
import Spanan from 'spanan';

(function (window) {
    const wrapper = new Spanan((message) => {
        message.source = 'dat-api';
        window.postMessage(message, '*');
    });
    const proxy = wrapper.createProxy();

    window.addEventListener('message', (event) => {
        if (event.data && 
                event.data.source === 'dat-api-response') {
            wrapper.handleMessage(event.data);
        }
    });

    window.DatArchive = createDatArchiveApi(proxy);
})(window);