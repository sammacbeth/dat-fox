import createDatArchiveApi from '../common/dat-archive-rpc';

const bridge = browser.extension.getBackgroundPage().bridge;
const DatArchive = createDatArchiveApi(bridge);

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
    document.getElementById('fork-button').onclick = async () => {
        const forkedArchive = await DatArchive.fork(archive.url, {});
        browser.tabs.update(tab.id, {
            url: forkedArchive.url,
        });
    }
});
