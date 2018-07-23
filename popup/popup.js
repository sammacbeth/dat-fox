import createDatArchiveApi from '../common/dat-archive-rpc';

const bridge = browser.extension.getBackgroundPage().bridge;
const DatArchive = createDatArchiveApi(bridge.api);

async function getTab() {
    const tabs = await browser.tabs.query({active: true, currentWindow: true});
    return tabs[0];
}

getTab().then(async (tab) => {
    console.log(tab);
    const archive = new DatArchive(tab.url);
    const { title, description, peers, isOwner } = await archive.getInfo();
    document.getElementById('title').innerText = title || '';
    document.getElementById('description').innerText = description || '';
    document.getElementById('peers').innerText = `Peers: ${peers}`;
    // action buttons
    const actionsElem = document.getElementById('actions');
    if (isOwner) {
        // View local files button - opens the file url for the dat folder on the local system
        const library = await bridge.api.listLibrary();
        const [,, datAddr] = archive.url.split('/');
        const libraryEntry = library.find(({ url }) => url === `dat://${datAddr}`);
        if (libraryEntry) {
            const filesButton = document.createElement('button');
            filesButton.setAttribute('class', 'btn');
            filesButton.innerText = 'View local files';
            filesButton.onclick = () => {
                browser.tabs.create({
                    url: `${libraryEntry.dir}`,
                });
            };
            actionsElem.appendChild(filesButton);
        }
    } else {
        const forkButton = document.createElement('button');
        forkButton.setAttribute('class', 'btn');
        forkButton.innerText = 'Fork Site';
        forkButton.onclick = async () => {
            const forkedArchive = await DatArchive.fork(archive.url, {});
            browser.tabs.update(tab.id, {
                url: forkedArchive.url,
            });
        };
        actionsElem.appendChild(forkButton);
    }
});
