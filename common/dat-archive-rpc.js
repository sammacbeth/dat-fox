
export default function(rpc) {

    return class DatArchive {
        constructor() {
            throw 'Not implemented';
        }

        static async resolveName(name) {
            return rpc.postMessage({ action: 'resolveName', name });
        }
    }
}