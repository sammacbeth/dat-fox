import createDatArchiveApi from '../common/dat-archive-rpc';

const { bridge } = browser.extension.getBackgroundPage();
const DatArchive = createDatArchiveApi(bridge);
const port = browser.runtime.connect();

// read options for dialog from url
const message = JSON.parse(decodeURIComponent(document.location.hash).substring(1));
if (!message.opts) {
    message.opts = {};
}
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
    };
});

function onSubmit(cb, formId, buttonId) {
    let submitted = false;
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
        return false;
    };
    document.getElementById(formId).onsubmit = onSubmit;
    document.getElementById(buttonId).click = onSubmit;
}

// fill fields from input options
async function setupForm() {
    if (action === 'create') {
        const title = document.getElementById('create-title');
        const desc = document.getElementById('create-desc');
        title.setAttribute('value', opts.title || '');
        desc.setAttribute('value', opts.description || '');
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
        document.getElementById('fork-url').innerText = srcArchive.url;
        const info = await srcArchive.getInfo({ timeout: 30000 });
        if (info.title) {
            document.getElementById('fork-message').innerText = `Fork '${info.title}'`;
        }
        const title = document.getElementById('fork-title');
        const desc = document.getElementById('fork-desc');
        title.setAttribute('value', opts.title || info.title || '');
        desc.setAttribute('value', opts.description || info.description || '');
        onSubmit(() => {
            title.setAttribute('disabled', true);
            desc.setAttribute('disabled', true);
            return DatArchive.fork(message.url, {
                title: title.value,
                description: desc.value,
            }).then((archive) => {
                port.postMessage({
                    action: 'dialogResponse',
                    dialogId: id,
                    result: archive.url,
                });
            });
        }, 'fork-form', 'fork-submit');
    } else if (action === 'selectArchive') {
        const library = await bridge.postMessage({ action: 'listLibrary' });
        const archiveList = document.getElementById('archives');
        library.forEach(async ({ url, dir }) => {
            const archive = new DatArchive(url);
            const { title, description } = await archive.getInfo();
            const template = document.createElement('template');
            template.innerHTML = `<a class="list-group-item list-group-item-action flex-column align-items-start" href="#">
                <h5>${title}</h5>
                <small>${dir}</small>
                <p>${description || ''}</p>
            </a>`;
            const elem = template.content.firstChild;
            archiveList.appendChild(elem);
            elem.onclick = () => {
                port.postMessage({
                    action: 'dialogResponse',
                    dialogId: id,
                    result: url,
                });
            };
        });
    }
}

setupForm();