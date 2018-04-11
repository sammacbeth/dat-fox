import DatArchiveBase from './dat-archive';


export default function(bridge) {
    return class DatArchive extends DatArchiveBase {
        static async resolveName(name) {
            return bridge.postMessage({ action: 'resolveName', name })
        }
    }
}
