/* globals ChromeUtils, ExtensionAPI */
ChromeUtils.import('resource://gre/modules/Services.jsm');

const processScriptUrl = new URL(`./process-script.js?now=${Date.now()}`, Components.stack.filename)

this.processScript = class extends ExtensionAPI {
  constructor(extension) {
    super(extension);
    this.processes = new Set();
  }

  onShutdown(reason) {
    console.log('[process-script] onShutdown');
    // send shutdown
    if (this.onMessage) {
      Services.ppmm.removeMessageListener('dat-webext', this.onMessage);
    }
    this.processes.forEach((pid) => {
      Services.ppmm.broadcastAsyncMessage(`process-${pid}`, {
        action: 'shutdown',
      });
    });
    Services.ppmm.removeDelayedProcessScript(processScriptUrl);
  }

  getAPI(context) {
    const self = this;
    const send = (channel, msg) => Services.ppmm.broadcastAsyncMessage(channel, msg);
    this.onMessage = ({data}) => {
      if (data.action === 'notifyProcessInit') {
        const pid = data.args[0];
        console.log('[process-script] registered process-script', pid);
        this.processes.add(pid);
        if (this.scriptUrl) {
          send(`process-${pid}`, { action: 'setScriptUrl', url: this.scriptUrl });
        }
      }
    }
    Services.ppmm.loadProcessScript(processScriptUrl, true);
    Services.ppmm.addMessageListener('dat-webext', this.onMessage);

    return {
      processScript: {
        setAPIScript: (url) => {
          self.scriptUrl = url;
          this.processes.forEach((pid) => {
            send(`process-${pid}`, { action: 'setScriptUrl', url: this.scriptUrl });
          });
        },
        sendMessage: (msg) => {
          this.processes.forEach((pid) => {
            send(`process-${pid}`, msg);
          });
        }
      }
    };
  }
};