
const port = browser.runtime.connect();

function postMessage(message) {
    port.postMessage(message);
}

const listeners = [];

port.onMessage.addListener((response) => {
    response.source = 'datfox-api-response';
    window.postMessage(response, '*');
    console.log('recv', response.uuid, response.action, response.response);
});

window.addEventListener('message', (event) => {
    if (event.source === window && event.data && 
            event.data.source === 'datfox-api') {
        console.log('send', event.data.uuid, event.data.action, ...event.data.args);
        port.postMessage(event.data);
    }
});

// inject datArchive script into the page
const scriptTag = document.createElement('script');
scriptTag.src = browser.extension.getURL('window.js');
const target = document.head || document.documentElement;
target.appendChild(scriptTag);
scriptTag.parentNode.removeChild(scriptTag);

// rewrite dat urls in the document to http
[...document.scripts]
.filter(e => e.src.startsWith('dat://'))
.forEach(e => {
    // write a new script element with a http url
    const scriptTag = document.createElement('script')
    scriptTag.src = e.src.replace('dat://', 'http://');
    e.parentNode.appendChild(scriptTag);
});

function rewriteDatImageUrls() {
    [...document.images]
    .filter(e => e.src.startsWith('dat://'))
    .forEach(e => e.src = e.src.replace('dat://', 'http://'));
}

rewriteDatImageUrls();
// rewrite images on the fly
document.onload = () => {
    const observer = new MutationObserver(rewriteDatImageUrls);
    observer.observe(document.body, { childList:true, subtree:true });
}