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

    deleteFiles(files, location) {
        core.ipc.send("deleteGDriveFiles", files, location.path);
    }

    createDirectory(parent, dir, location) {
        console.log("CREATE FOLDER: ", dir);
        let sPath = location.realPath.split('/');
        let rParent = sPath[sPath.length - 1];
        core.ipc.send("createGDriveDirectory", rParent, dir, location.path);
    }

    copyFiles(from, to, files, update) {
        core.ipc.send("copyGDriveFiles", update, to, files);
    }
}