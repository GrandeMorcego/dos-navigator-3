const path = require('path');
const electron = require('electron');
const Store = require("electron-store");

const store = new Store();

const { ipcMain } = electron;

const isDev = (process.env.NODE_ENV === 'development');

const core = {
    ipcMain,
    isDev,
    store,

    appPath() {
        return process.env.NODE_ENV === 'production'
          ? path.resolve(__dirname, '../')
          : path.resolve(__dirname, '../../');
    },

    fileUrl(filePath) {
        return `file://${filePath}`.replace(/[?#,%,&]/g, encodeURIComponent);
    },

    appUrl() {
            return isDev ? 'http://localhost:9080' : core.fileUrl( path.resolve(path.join( core.appPath(), 'dist/renderer/index.html')));
    },

};


module.exports = core;