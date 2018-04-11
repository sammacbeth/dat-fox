
const wellKnownCache = new Map();

// TODO: see if we can browserify dat-dns
export function resolveName(host) {
    return new Promise((resolve, reject) => {
        if (wellKnownCache.has(host)) {
            resolve(Promise.resolve(wellKnownCache.get(host)));
        }
        fetch(`https://${host}/.well-known/dat`, { redirect: 'manual' }).then((resp) => {
            if (resp.ok) {
                return resp.text().then(text => {
                    try {
                        return /^dat:\/\/([0-9a-f]{64})/i.exec(text.split('/n')[0])[1];
                    } catch(e) {
                        return false;
                    }
                });
            }
            return false;
        }).then((address) => {
            wellKnownCache.set(host, address);
            if (!address) {
                reject();
                return;
            }
            resolve(address);
        });
    });
}