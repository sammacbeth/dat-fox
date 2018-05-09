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

function onSubmit(cb, formId, buttonId) {
    const onSubmit = () => {
        if (submitted) {
            return false;
        }
        console.log('submit');
        submitted = true;
        cb().catch((error) => {
            port.postMessage({
                action: 'dialogResponse',
                dialogId: id,
                error: error.toString(),
            });
        });
        document.getElementById(formId).onsubmit = onSubmit;
        document.getElementById(buttonId).click = onSubmit;
        return false;
    };
}

// fill fields from input options
async function setupForm() {
    if (action === 'create') {
        const title = document.getElementById('create-title');
        const desc = document.getElementById('create-desc');
        title.setAttribute('value', opts.title || '');
        desc.setAttribute('value', opts.description || '');
        let submitted = false;
        onSubmit(() => 
            DatArchive.create({
                title: title.getAttribute('value'),
                desc: desc.getAttribute('value'),
            }).then((archive) => {
                port.postMessage({
                    action: 'dialogResponse',
                    dialogId: id,
                    result: archive.url,
                });
            }), 'create-form', 'create-submit');
    } else if (action === 'fork') {
        console.log(opts, message);
        const srcArchive = new DatArchive(message.url);
        document.getElementById('fork-url').innerText = message.url;
        const info = await srcArchive.getInfo({ timeout: 30000 });
        if (info.title) {
            document.getElementById('fork-message').innerText = `Fork '${info.title}'`;
        }
        const title = document.getElementById('fork-title');
        const desc = document.getElementById('fork-desc');
        title.setAttribute('value', opts.title || info.title || '');
        desc.setAttribute('value', opts.description || info.description || '');
        onSubmit(() =>
            DatArchive.fork(message.url, {
                title: title.getAttribute('value'),
                desc: desc.getAttribute('value'),
            }).then((archive) => {
                port.postMessage({
                    action: 'dialogResponse',
                    dialogId: id,
                    result: archive.url,
                });
            }), 'fork-form', 'fork-submit');
    }
}

setupForm();