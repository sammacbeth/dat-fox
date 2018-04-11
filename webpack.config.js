const path = require("path");

module.exports = {
    entry: {
        background: "./background/background.js",
    },
    output: {
        path: path.resolve(__dirname, "addon"),
        filename: "[name]/index.js"
    }
};