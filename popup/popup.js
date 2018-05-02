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
    const { title, description, peers } = await archive.getInfo();
    const div = document.getElementById('content');
    div.innerHTML = `<h2>${title || ''}</h2><p>${description || ''}</p><p>Peers: ${peers}</p>`;
});
