import createDatArchiveApi from '../common/dat-archive-rpc';

const { bridge, dialogs } = browser.extension.getBackgroundPage();
const DatArchive = createDatArchiveApi(bridge);
const port = browser.runtime.connect();

// read options for dialog from url
const message = JSON.parse(decodeURIComponent(document.location.hash).substring(1));
const { action, opts, id } = message;

// make action visible
document.getElementById(action).style.display = 'block';

// register cancel listeners
Array.prototype.forEach.call(document.getElementsByClassName('cancel'), (btn) => {
    btn.onclick = async () => {
        port.postMessage({
            action: 'dialogResponse',
            dialogId: id,
            error: 'User aborted',
        });
    }
});

// fill fields from input options
if (action === 'create') {
    const title = document.getElementById('create-title');
    const desc = document.getElementById('create-desc');
    title.setAttribute('value', opts.title || '');
    desc.setAttribute('value', opts.description || '');
    let submitted = false;
    const onSubmit = () => {
        if (submitted) {
            return false;
        }
        submitted = true;
        console.log('submit');
        DatArchive.create({
            title: title.getAttribute('value'),
            desc: desc.getAttribute('value'),
        }).then((archive) => {
            port.postMessage({
                action: 'dialogResponse',
                dialogId: id,
                result: archive.url,
            });
        }, (error) => {
            port.postMessage({
                action: 'dialogResponse',
                dialogId: id,
                error: error.toString(),
            });
        });
        return false;
    };
    document.getElementById('create-submit').click = onSubmit;
    document.getElementById('create-form').onsubmit = onSubmit;
}