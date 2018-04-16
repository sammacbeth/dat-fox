const path = require("path");

module.exports = {
    entry: {
        background: "./background/background.js",
        window: "./window/window.js",
    },
    output: {
        path: path.resolve(__dirname, "addon"),
        filename: "[name].js"
    }
};