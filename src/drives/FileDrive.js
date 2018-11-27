import ObservedObject from 'observed-object'

import core from '../system/core';

export default class BasicDrive extends ObservedObject {

    getAvailableCommands() {
        return ([]);
    }

    executeCommand( command, { sender, location, currentFile, }  ) {

    }

    getFiles({ sender, location }, handler, fromHomeDir) {
        let listHandlers = this.listHandlers;

        if (!listHandlers) {
            listHandlers = { };
            this.listHandlers = listHandlers;

            core.ipc.on("getFiles", this.handleGetFiles);
        }


        

        listHandlers[sender] = handler;

        console.log('Gettings files: ', location);

        core.ipc.send("needFiles", {
                sender: sender,
                location: location,
                fromHomeDir: fromHomeDir
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

    deleteFiles(files, location, perm) {
        core.ipc.send("deleteFiles", files, location.path, perm);
    }

    createDirectory(location, path) {
        core.ipc.send("createDirectory", location, path);
    }

    copyFiles(from, to, files) {
        core.ipc.send("copyFiles", from.path, to, files);
    }
}


export class FileDrive extends BasicDrive {

    executeCommand( command, { sender, location, currentFile, }  ) {

    }

    getAvailableCommands() {
        return (
            [
                "open",
                "upDir",
                "openDir",
            ]
        );
    }


} 