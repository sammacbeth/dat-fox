export default function(rpc) {

    return class DatArchive {
        constructor(datUrl) {
            // in some cases a http url might be passed here
            // (e.g. if document.location is used by the page)
            this.url = datUrl.replace('http://', 'dat://');
        }

        static async create(opts) {
            return rpc.postMessage({ action: 'create', opts }).then(url => new DatArchive(url));
        }

        static async fork(url, opts) {
            return rpc.postMessage({ action: 'fork', url, opts }).then(url => new DatArchive(url));
        }

        static async selectArchive({ title, buttonLabel, filters } = {}) {
            throw new Error('DatArchive.selectArchive: Not implemented');
        }

        static async resolveName(name) {
            return rpc.postMessage({ action: 'resolveName', name });
        }

        async getInfo(opts) {
            return rpc.postMessage({ action: 'getInfo', url: this.url, opts: { timeout: 30000 } });
        }

        async stat(path, opts) {
            return rpc.postMessage({
                action: 'stat',
                url: this.url,
                path,
                opts,
            });
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
            return rpc.postMessage({
                action: 'readdir',
                url: this.url,
                path,
                opts,
            });
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

         async createFileActivityStream(pattern) {
            throw new Error('DatArchive.createFileActivityStream: Not implemented');
         }

         async createNetworkActivityStream() {
            throw new Error('DatArchive.createNetworkActivityStream: Not implemented');
         }
    }
}