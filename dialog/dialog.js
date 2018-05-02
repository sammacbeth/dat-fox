import createDatArchiveApi from '../common/dat-archive-rpc';

const { bridge, dialogs } = browser.extension.getBackgroundPage();
const DatArchive = createDatArchiveApi(bridge);
const port = browser.runtime.connect();

// read options for dialog from url
const message = JSON.parse(decodeURIComponent(document.location.hash).substring(1));
const { action, opts, id } = message;

document.getElementById(action).style.display = 'block';
Array.prototype.forEach.call(document.getElementsByClassName('cancel'), (btn) => {
    btn.onclick = async () => {
        await port.postMessage({
            action: 'dialogResponse',
            dialogId: id,
            error: 'User aborted',
        });
        window.close();
    }
});