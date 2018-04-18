export default function(rpc) {

    return class DatArchive {
        constructor(datUrl) {
            this.url = datUrl;
        }

        static async create({ title, description }= {}) {
            throw new Error('DatArchive.create: Not implemented');
        }

        static async fork(url, { title, description } = {}) {
            throw new Error('DatArchive.fork: Not implemented');
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
            throw new Error('DatArchive.writeFile: Not implemented');
        }

        async mkdir(path) {
            throw new Error('DatArchive.mkdir: Not implemented');
        }

        async unlink(path) {
            throw new Error('DatArchive.unlink: Not implemented');
        }

        async rmdir(path, opts) {
            throw new Error('DatArchive.rmdir: Not implemented');
        }

        async diff(opts) {
            throw new Error('DatArchive.diff: Not implemented');
        }

        async commit() {
            throw new Error('DatArchive.commit: Not implemented');
        }

         async revert() {
            throw new Error('DatArchive.revert: Not implemented');
         }

         async history(opts) {
            return rpc.postMessage({
                action: 'history',
                url: this.url,
                opts,
            });
         }

         async download(path, opts) {
            throw new Error('DatArchive.download: Not implemented');
         }

         async createFileActivityStream(pattern) {
            throw new Error('DatArchive.createFileActivityStream: Not implemented');
         }

         async createNetworkActivityStream() {
            throw new Error('DatArchive.createNetworkActivityStream: Not implemented');
         }
    }
}