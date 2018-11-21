ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");

let WEB_API_URL = '';
const extensionId = '{acc91f3f-2194-4f88-b25a-84ec4ea65683}';
const sendToBackground = function(msg) {
  Services.cpmm.sendAsyncMessage('MessageChannel:Messages', [{
    messageName: 'Extension:Message',
    channelId: ExtensionUtils.getUniqueId(),
      sender: {
        id: extensionId,
        extensionId,
      },
      recipient: {
        extensionId,
      },
      data: new StructuredCloneHolder(msg),
    responseType: 3 // MessageChannel.RESPONSE_NONE
  }]);
}

const getContentScript = (url) => {
  try {
    Components.utils.importGlobalProperties(['ChromeUtils']);
  } catch (e) {
    // ChromeUtils are available only in Firefox 60 +
    return Promise.resolve({ hasReturnValue: false });
  }

  if (getContentScript[url]) {
    return Promise.resolve(getContentScript[url]);
  }

  return ChromeUtils.compileScript(url).then((script) => {
    getContentScript[url] = script;
    return script;
  });
};

/**
 * Run function for all existing documents.
 */
function forEachTab(fn) {
  const windowEnumerator = Services.ww.getWindowEnumerator();
  while (windowEnumerator.hasMoreElements()) {
    const window = windowEnumerator.getNext();

    if (window.gBrowser && window.gBrowser.tabs && window.gBrowser.tabs.forEach) {
      // this is a browser (chrome) window so we need to inject the
      // content scripts in all openend tabs
      window.gBrowser.tabs.forEach((tab) => {
        try {
          fn(tab.linkedBrowser.contentDocument);
        } catch (e) {
          // failed to load into existing window
        }
      });
    } else {
      // this is a content window so we need to inject content scripts directly
      try {
        fn(window.document);
      } catch (e) {
        // failed to load into existing window
      }
    }
  }
}

const datUrlMatcher = /^http:\/\/[0-9a-f]{64}\/.*$/;

function isDatPage(document, window) {
  if (!document || !document.location || !window) {
    return false;
  }
  const currentUrl = window.location.href;
  if (currentUrl.indexOf('dat://') !== 0 && !datUrlMatcher.test(currentUrl)) {
    return false;
  }
  return true;
};

const DocumentManager = {
  init() {
    Services.obs.addObserver(this, 'document-element-inserted', false);
    getContentScript(WEB_API_URL).then(() => {
      forEachTab(this.observe.bind(this));
    });
    this._onMessage = this.onMessage.bind(this);
  },

  uninit() {
    forEachTab(this.cleanup.bind(this));
    Services.obs.removeObserver(this, 'document-element-inserted');
  },

  cleanup(document) {
    const window = document && document.defaultView;
    if (!isDatPage(document, window)) {
      return;
    }
    window.removeEventListener('message', this._onMessage);
  },

  onMessage({ data }) {
    if (data.source === 'dat-api') {
      sendToBackground(data);
    }
  },

  async observe(document) {
    const window = document && document.defaultView;
    if (!isDatPage(document, window)) {
      return;
    }
    const webApiScript = getContentScript[WEB_API_URL];
    const unsafeWindow = Components.utils.waiveXrays(window);
    webApiScript.executeInGlobal(unsafeWindow);

    window.addEventListener('message', this._onMessage);
  }
}

const processId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  /* eslint-disable */
  const r = Math.random() * 16|0, v = c === 'x' ? r : (r&0x3|0x8);
  /* eslint-enable */
  return v.toString(16);
});

const onMessage = ({ data }) => {
  if (data.action === 'setScriptUrl') {
    WEB_API_URL = data.url;
    DocumentManager.init();
  } else if (data.action === 'shutdown') {
    console.log('[process-script] got shutdown');
    DocumentManager.uninit();
    removeMessageListener(`process-${processId}`, onMessage);
  } else {
    data.source = 'dat-api-response';
    forEachTab((document) => {
      const window = document && document.defaultView;
      if (!isDatPage(document, window)) {
        return;
      }
      window.postMessage(data, '*');
    });
  }
};

addMessageListener(`process-${processId}`, onMessage);

// notify extension API of this process script
Services.cpmm.sendAsyncMessage('dat-webext', {
  action: 'notifyProcessInit',
  args: [processId],
});
