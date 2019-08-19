import createDatArchiveApi from '../common/dat-archive-rpc';
import urlParse from 'url-parse';
import Spanan from 'spanan';

(function (window) {
    const wrapper = new Spanan((message) => {
        message.source = 'datfox-api';
        window.postMessage(message, '*');
    });
    const proxy = wrapper.createProxy();

    window.addEventListener('message', (event) => {
        if (event.source === window && event.data && 
                event.data.source === 'datfox-api-response') {
            wrapper.handleMessage(event.data);
        }
    });

    window.DatArchive = createDatArchiveApi(proxy);

    let urlTest = new window.URL('dat://example.com');
    if (urlTest.hostname !== 'example.com' ||
            urlTest.origin !== 'dat://example.com') {
        let originalURL = window.URL;
        let newURL = urlParse;
        
        newURL.createObjectURL = originalURL.createObjectURL;
        newURL.revokeObjectURL = originalURL.revokeObjectURL;
        
        window.URL = newURL;
    }

})(window);
