import LocalDatArchiveImpl from './dat-archive';
import bridgedDatArchiveImpl from './bridged-dat-archive';

let datArchive = LocalDatArchiveImpl;

export function useNativeBridge(bridge) {
    datArchive = bridgedDatArchiveImpl(bridge);
}

export default {
    get DatArchive() {
        return datArchive;
    }
}