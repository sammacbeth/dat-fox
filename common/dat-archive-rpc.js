import base64js from 'base64-js';
import urlParse from 'url-parse';

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
            const listeners = this.listeners[event];
            rpc.pollActivityStream({
                streamId,
                event,
            }).then((events) => {
                events.forEach((evt) => {
                    listeners.forEach((fn) => {
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
                rpc.closeActivityStream({
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

    function cleanPath(path) {
        // standardise path format across platforms
        // replace windows style separators with unix
        const cleanedPath = path.replace(/\\/g, '/');
        if (cleanedPath.startsWith('/')) {
            return cleanedPath.substring(1);
        }
        return cleanedPath;
    }

    return class DatArchive {
        constructor(datUrl) {
            // in some cases a http url might be passed here
            // (e.g. if document.location is used by the page)
            const parts = urlParse(datUrl);
            if (!parts.host) {
                throw 'Invalid dat:// URL';
            }
            this.url = `dat://${parts.host}`;
        }

        static async create(opts) {
            return rpc.create({ opts }).then(url => new DatArchive(url));
        }

        static async fork(url, opts) {
            return rpc.fork({ url, opts }).then(url => new DatArchive(url));
        }

        static async selectArchive(opts) {
            return rpc.selectArchive({ opts }).then(url => new DatArchive(url));
        }

        static async resolveName(name) {
            return rpc.resolveName({ name });
        }

        async getInfo(opts) {
            return rpc.getInfo({ url: this.url, opts });
        }

        async configure(opts) {
            return rpc.configure({ url: this.url, opts });
        }

        async copy(path, dstPath, opts) {
            return rpc.copy({
                url: this.url,
                path,
                dstPath,
                opts
            });
        }

        async stat(path, opts) {
            const stat = await rpc.stat({
                url: this.url,
                path,
                opts,
            });
            return new Stat(stat);
        }

        async readFile(path, opts) {
            if (opts && opts.encoding === 'binary') {
                // use base64 and then convert back to binary here
                const optsCopy = Object.assign({}, opts);
                optsCopy.encoding = 'base64';
                const b64Contents = await this.readFile(path, optsCopy);
                return base64js.toByteArray(b64Contents).buffer;
            }
            return rpc.readFile({
                url: this.url,
                path,
                opts,
            });
        }

        async readdir(path, opts) {
            const dir = await rpc.readdir({
                url: this.url,
                path,
                opts,
            });
            if (opts && opts.stat) {
                return dir.map(({ name, stat }) => ({ name: cleanPath(name), stat: new Stat(stat)}));
            }
            return dir.map(cleanPath);
        }

        async writeFile(path, data, opts) {
            if ((opts && opts.encoding === 'binary') || data instanceof ArrayBuffer) {
                // convert binary to base64 and write that instead
                const optsCopy = Object.assign({}, opts);
                optsCopy.encoding = 'base64';
                return this.writeFile(path, base64js.fromByteArray(new Uint8Array(data)), optsCopy);
            }
            return rpc.writeFile({
                url: this.url,
                path,
                data,
                opts,
            });
        }

        async mkdir(path) {
            return rpc.mkdir({
                url: this.url,
                path,
            });
        }

        async unlink(path) {
            return rpc.unlink({
                url: this.url,
                path,
            });
        }

        async rmdir(path, opts) {
            return rpc.rmdir({
                url: this.url,
                path,
                opts,
            });
        }

        async rename(oldPath, newPath, opts) {
            return rpc.rename({
                url: this.url,
                oldPath,
                newPath,
                opts,
            });
        }

        async diff(opts) {
            return rpc.diff({
                url: this.url,
                opts,
            });
        }

        async commit() {
            return rpc.commit({
                url: this.url,
            });
        }

        async revert() {
            return rpc.revert({
                url: this.url,
            });
        }

        async history(opts) {
            return rpc.history({
                url: this.url,
                opts,
            });
        }

        async download(path, opts) {
            return rpc.download({
                url: this.url,
                path,
                opts,
            });
        }

        watch(pattern) {
            return this.createFileActivityStream(pattern);
        }

        createFileActivityStream(pattern) {
            return new ActivityStream(rpc.createFileActivityStream({
                url: this.url,
                pattern,
            }));
        }

        createNetworkActivityStream() {
            return new ActivityStream(rpc.createNetworkActivityStream({
                url: this.url,
            }));
        }
    };
}