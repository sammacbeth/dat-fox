
export default function(rpc) {

    class ActivityStream {
        constructor(streamCreated) {
            this.getId = streamCreated.then(({ streamId }) => streamId);
            this.listeners = {};
            this.closed = false;
        }

        addEventListener(event, fn) {
            if (!this.listeners[event]) {
                this.listeners[event] = [fn];
                this.getId.then(id => {
                    this._runloop(id, event);
                });
            } else {
                this.listeners[event].push(fn);
            }
        }

        _runloop(streamId, event) {
            if (this.closed) {
                return Promise.resolve();
            }
            rpc.postMessage({
                action: 'pollActivityStream',
                streamId,
                event,
            }).then((events) => {
                events.forEach((evt) => {
                    this.listeners[event].forEach((fn) => {
                        try {
                            fn(evt);
                        } catch(e) {
                            console.error('Error in stream event listener', e);
                        }
                    });
                });
            }).then(() => this._runloop(streamId, event));
        }

        close() {
            this.closed = true;
            this.listeners = {};
            this.getId.then(streamId => {
                rpc.postMessage({
                    action: 'closeActivityStream',
                    streamId,
                });
            });
        }
    }

    class Stat {
        constructor(stat) {
            Object.assign(this, stat);
        }

        isDirectory() {
            return this._isDirectory;
        }

        isFile() {
            return this._isFile;
        }
    }

    return class DatArchive {
        constructor(datUrl) {
            // in some cases a http url might be passed here
            // (e.g. if document.location is used by the page)
            const [,, address] = datUrl.split('/');
            this.url = `dat://${address}`;
        }

        static async create(opts) {
            return rpc.postMessage({ action: 'create', opts }).then(url => new DatArchive(url));
        }

        static async fork(url, opts) {
            return rpc.postMessage({ action: 'fork', url, opts }).then(url => new DatArchive(url));
        }

        static async selectArchive(opts) {
            return rpc.postMessage({ action: 'selectArchive', opts }).then(url => new DatArchive(url));
        }

        static async resolveName(name) {
            return rpc.postMessage({ action: 'resolveName', name });
        }

        async getInfo(opts) {
            return rpc.postMessage({ action: 'getInfo', url: this.url, opts });
        }

        async stat(path, opts) {
            const stat = await rpc.postMessage({
                action: 'stat',
                url: this.url,
                path,
                opts,
            });
            return new Stat(stat);
        }

        async readFile(path, opts) {
            return rpc.postMessage({
                action: 'readFile',
                url: this.url,
                path,
                opts,
            });
        }

        async readdir(path, opts) {
            const dir = await rpc.postMessage({
                action: 'readdir',
                url: this.url,
                path,
                opts,
            });
            if (opts && opts.stat) {
                return dir.map(({ name, stat }) => ({ name, stat: new Stat(stat)}));
            }
            return dir;
        }

        async writeFile(path, data, opts) {
            return rpc.postMessage({
                action: 'writeFile',
                url: this.url,
                path,
                data,
                opts,
            });
        }

        async mkdir(path) {
            return rpc.postMessage({
                action: 'mkdir',
                url: this.url,
                path,
            });
        }

        async unlink(path) {
            return rpc.postMessage({
                action: 'unlink',
                url: this.url,
                path,
            });
        }

        async rmdir(path, opts) {
            return rpc.postMessage({
                action: 'rmdir',
                url: this.url,
                path,
                opts,
            });
        }

        async diff(opts) {
            return rpc.postMessage({
                action: 'diff',
                url: this.url,
                opts,
            });
        }

        async commit() {
            return rpc.postMessage({
                action: 'commit',
                url: this.url,
            });
        }

        async revert() {
            return rpc.postMessage({
                action: 'revert',
                url: this.url,
            });
        }

        async history(opts) {
            return rpc.postMessage({
                action: 'history',
                url: this.url,
                opts,
            });
        }

        async download(path, opts) {
            return rpc.postMessage({
                action: 'download',
                url: this.url,
                path,
                opts,
            });
        }

        createFileActivityStream(pattern) {
            return new ActivityStream(rpc.postMessage({
                action: 'createFileActivityStream',
                url: this.url,
                pattern,
            }));
        }

        createNetworkActivityStream() {
            return new ActivityStream(rpc.postMessage({
                action: 'createNetworkActivityStream',
                url: this.url,
            }));
        }
    };
}