import { resolveName } from './dat-dns';

export default class DatArchive {
    constructor (url) {

    }

    static async resolveName(name) {
        return resolveName(name);
    }

}
