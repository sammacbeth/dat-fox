const path = require("path");

module.exports = {
    entry: {
        background: "./background/background.js",
        window: "./window/window.js",
        popup: "./popup/popup.js",
        dialog: "./dialog/dialog.js",
    },
    output: {
        path: path.resolve(__dirname, "addon"),
        filename: "[name].js"
    }
};