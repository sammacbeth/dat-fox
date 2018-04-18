import { resolveName } from './dat-dns';

export default class DatArchive {
    constructor(datUrl) {
        this.url = datUrl;
    }

    static resolveName(name) {
        return resolveName(name);
    }
}
