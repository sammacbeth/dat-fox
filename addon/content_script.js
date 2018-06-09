
const port = browser.runtime.connect();

function postMessage(message) {
    port.postMessage(message);
}

const listeners = [];

port.onMessage.addListener((response) => {
    listeners.forEach(fn => fn(JSON.stringify(response)));
});

function addListener(fn) {
    listeners.push(fn)
}

// expose communication channel to background for datArchive API
exportFunction(postMessage, window, { defineAs: '_datfoxPostMessage' });
exportFunction(addListener, window, { defineAs: '_datfoxAddListener' });

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
const observer = new MutationObserver(rewriteDatImageUrls);
observer.observe(document.body, { childList:true, subtree:true });
