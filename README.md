# Dat-Firefox

This is a prototype browser extension which makes `dat://` urls function in Firefox using a slightly
modified [dat-gateway](https://github.com/sammacbeth/dat-gateway) as a bridge to the dat network.

It aims to implement native-like dat support possible in Firefox. This means:

1. Links to `dat://` addresses and sites should work directly. While [Webextensions protocol handlers](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/protocol_handlers) are limited - we cannot show `dat://` in the address bar on a loaded page - we can at least properly process the initial URL or link.
2. Dat site operate on the correct origin. When using the [dat-gateway](https://github.com/pfrazee/dat-gateway) to bridge to the dat network, all dat addresses look like `http://localhost:3000/{hash}/path`. This has the effect of potentially breaking relative URLs on the page, and also preventing the web's cross-origin policies from preventing data leakage between sites. To fix this we have to make `{hash}` the origin.

## Usage

1. Grab [this fork of dat-gateway](https://github.com/sammacbeth/dat-gateway) and run it:

   ```bash
   git clone https://github.com/sammacbeth/dat-gateway.git
   cd dat-gateway
   npm install
   ./bin.js
   ```

   ​

2. Install the extension: (1) git clone this project, (2) open a tab with the address `about:debugging`, (3) click "Load Temporary Add-on", (4) choose the file `..../dat-fox/manifest.json`.

3. Visit a `dat://` URL. 

## What works

* Load content from dat archives with the following URL types:
   * `dat://{hash}`
   * `http://{hash}`
   * `dat://{hostname}` (using [Dat Discovery](https://github.com/beakerbrowser/beaker/wiki/Authenticated-Dat-URLs-and-HTTPS-to-Dat-Discovery))
* Toggle between `https` to `dat` protocol for Dat-enabled sites.

## What does not work

Due to limitations in the WebExtensions protocol handler API, non main-frame `dat://` urls do not load. For static resources we can circumvent this by rewriting `dat://` to `http://` in HTML files using a [StreamFilter](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/StreamFilter). However, dynamically generated requests will fail.

Any Dat site which relies on the [DatArchive](https://beakerbrowser.com/docs/apis/dat.html) will not work.

## How it works

1. The [protocol handler](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/protocol_handlers) redirects `dat://` urls to a special handler domain (`dat.redirect`), passing the full url.
2. A [webRequest](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest) listener intercepts requests to this domain and redirects to a `http://` URL with the dat key or hostname as the origin.
3. A [proxy PAC](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/proxy) file intercepts hostnames matching a dat key pattern, or hostnames the user has explicitly ask to load over dat. Requests for these URLs are proxied via the dat-gateway (acting as a HTTP proxy). This allows us to make 'fake' hostnames work, and create the origins we need for dat sites.

