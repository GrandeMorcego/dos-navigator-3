import ObservedObject from 'observed-object'

import core from '../system/core';

export default class GoogleDrive extends ObservedObject {
    getFiles({ sender, location }, handler, fromHomeDir) {
        let listHandlers = this.listHandlers;

        if (!listHandlers) {
            listHandlers = { };
            this.listHandlers = listHandlers;

            core.ipc.on("getGDriveFilesCallback", this.handleGetFiles);
        }
        listHandlers[sender] = handler;

        console.log('Gettings files: ', location);

        core.ipc.send("getGDriveFiles", {
                sender: sender,
                location: location,
                fromHomeDir: fromHomeDir,
                credentials: JSON.parse(localStorage.getItem("googleCredentials"))
            }
        );

    }

    handleGetFiles = (event, sender, location, files ) => {
        console.log("! GOT FILES: ", files);
        const handler = this.listHandlers[sender];

        if (handler) {
            handler(location, files)
        }
        
    }
}