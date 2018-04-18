import LocalDatArchiveImpl from './dat-archive';
import createDatArchiveApi from '../common/dat-archive-rpc';

let datArchive = LocalDatArchiveImpl;

export function useNativeBridge(bridge) {
    datArchive = createDatArchiveApi(bridge);
}

export default {
    get DatArchive() {
        return datArchive;
    }
};
