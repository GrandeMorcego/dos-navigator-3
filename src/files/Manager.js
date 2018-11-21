import core from '../system/core';
import ObservedObject from "observed-object";
import ln3 from "ln3";
import { BrowserWindow, ipcMain } from 'electron';
import { configureRequestOptions } from 'builder-util-runtime';
import os from 'os';


export default class FilePanelManager extends ObservedObject {

    constructor(panelId, location) {
        super();
        this.selectedCount = 0;
        this.files = null;
        this.currentIndex = 0;
        this.panelId = panelId;
        this.driveHandler = null;
        this.location = location;
    }

    selectFile(file, onOff) {
        if (file.selected != onOff) {
            file.selected = onOff;
            if (file.e) {
                file.e.forceUpdate();
            }
            this.setSelectedCount(this.selectedCount + ( onOff ? 1 : -1), file);
        }
    }

    selectMultipleFiles(files, onOff) {
        let delta = 0;
        const change = onOff ? 1 : -1;

        files.forEach( file => {
            if (file.selected != onOff) {
                file.selected = onOff;
                delta += change;
            }
        });

        this.setSelectedCount(this.selectedCount + delta);

        if (delta * change < 40) {
            files.forEach(file => { file.e.forceUpdate() });
        } else {
            this.emit("refresh");
        }
    }

    recountSelected() {
        let newSelected = 0;

        this.files.forEach( file => { if (file.selected) newSelected++; } );

        this.setSelectedCount(newSelected)
    }

    setSelectedCount(newCount, file) {
        const selCount = this.selectedCount;
        const delta = newCount - selCount;
        if (delta) {
            this.selectedCount = newCount;
            this.emit("selectedChange", newCount, delta, file);
            if (newCount === 0 || selCount === 0);
            this.emit("hasSelected", newCount != 0);
        }
    }
    /** Reads the file by the specified path
     * 
     * @param file File (with all parameters) that need to be read
     */
    readFile(file) {
        if (!file.isDir) {
            let fileData;
            core.ipc.once('readFileContentCallback', (event, status, data) => {
                if (status != 'ERR') {
                    core.emit('gotFileContent', data, file, this.location.path);
                } else {
                    core.emit('displayError', 'Some error has occured while reading this file');
                }
            });
            
            core.ipc.send("readFileContent", this.location.path + '/' + file.name);
        } else {
            return "ERRISDIR"
        }
    }

    openFile(file, path) {
        // if (file.ext != '.SH') {
            core.ipc.send('execFile', path + '/' + file.name);
            core.ipc.once('execFileCallback', (event, status, err) => {
                if (status != "SUCCESS") {
                    console.log('Error: ', err);
                    if (err.code == 'EACCES') {
                        core.emit('displayError', 'This file cannot be executed');
                    }
                }
            })
        // } else {
        //     core.emit('execBashFile', path + '/' + file.name);
        // }

        
    }
    /** Saves current file
     *  
     * @param filePath Path to the file that need to be saved
     * @param data New data of this file
     */
    saveFile(filePath, data) {
        core.ipc.send('saveFile', filePath, data);
        core.ipc.on('saveFileCallback', (event, status, err) => {
            if (status != "SUCCESS") {
                console.log('ERRIPC: ', err);
            } else {
                console.log(status);
            }
        })
    }

    /** Reads file list in the current location with possible addition 
     * 
     * @param addToPath can be either a sub-path to the current location's path or ".." for parent directory 
     * @param {boolean} fromHomeDir read files from the root of the specified drive
     */
    readFiles(addToPath, fromHomeDir, fileName){
        console.log(addToPath);
        // if (addToPath != 'googleDrive') {
            if (this.driveHandler) {
                this.driveHandler.getFiles({
                    sender: this.panelId,
                    location: {
                        ...this.location, 
                        addToPath: addToPath,
                        fileName: fileName
                    }
                }, this.handleGetFiles, fromHomeDir);
            }
        // } else {
        //     let credentials = JSON.parse(localStorage.getItem("googleCredentials"));
        //     console.log(credentials)
        //     core.ipc.send("openDrive", credentials);
        //     core.ipc.once("openDriveCallback", (event, files) => {
        //         console.log(files);
        //         this.handleGetFiles({drive: 'googleDrive', path: "Google Drive:/root"}, files);
        //         console.log(core.location);
        //     })
        // }
        

        // core.ipc.removeListener("getFiles", this.handleGetFiles);        
    }

    deleteFiles(files, perm) {
        if (this.driveHandler) {
            this.driveHandler.deleteFiles(files, this.location, perm);
        }
    }

    handleDeleteFiles(file, isRClick) {
        let files = this.files;
        let deletingFiles = this.getCheckedFiles(files);
        if (deletingFiles == 'NOCHECK' || isRClick) {
            deletingFiles = [{
                name: file.name,
                id: file.fileId
            }];
        }
        core.emit('deletingFiles', deletingFiles, this.panelId, isRClick, this);
    }

    filesSelectByColor = (file, action) => {
        let files = this.files
        let color = file.color;
        let selectingFiles = [];
        for (let i=0; i<files.length; i++) {
            if (files[i].color == color) {
                selectingFiles.push(files[i]);
            }
        }
        this.selectMultipleFiles(selectingFiles, action)
    }

    filesSelectByType = (file, action) => {
        let files = this.files;
        let selectingFiles = [];
        if (file.isDir) {
            for (let i=0; i < files.length; i++) {
                if (files[i].isDir) {
                    selectingFiles.push(files[i]);
                }
            }
        } else if (file.ext != '') {
            for (let i=0; i < files.length; i++) {
                if (files[i].ext === file.ext) {
                    selectingFiles.push(files[i]);
                }
            }
        } else {
            for (let i=0; i < files.length; i++) {
                if (files[i].ext === "" && !files[i].isDir) {
                    selectingFiles.push(files[i]);
                }
            }
        }
        this.selectMultipleFiles(selectingFiles, action);
    }

    cutCopyFiles(file, action) {
        let files = this.files
        core.pastingFiles = {
            files: [],
            action: action
        };
        let copyFiles = this.getCheckedFiles(files);
        if (copyFiles == 'NOCHECK') {
            core.pastingFiles.files.push({
                path: this.location.path,
                name: file.name,
            })
        } else {
            copyFiles.forEach((copyFile) => {
                core.pastingFiles.files.push({
                    path: this.location.path,
                    name: copyFile.name,
                })
            })
        }
    }

    pasteFiles() {
        if (core.pastingFiles.files && core.pastingFiles.files[0]) {
            if (core.pastingFiles.files[0].path == this.location.path) {
                core.emit('displayError', 'You cannot copy file into the same directory');
            } else {
                core.ipc.send('fastCopyFile', core.pastingFiles.files, this.location.path, core.pastingFiles.action);
            }
        } else {
            console.log('There is no files to paste');
        }
    }

    reformatPath(value, location) {
        if ((value.charAt(0) == '/'  && os.type != "Windows_NT") || (value.charAt(1) == ':'  && os.type == "Windows_NT")) {
            return ['root', value]
        } else if ((value.charAt(1) == ':' && os.type != "Windows_NT") || (value.charAt(0) == '/' && os.type == "Windows_NT")) {
            return ['ERR', 'Wrong path format']
        } else if (value.charAt(0) == '.' && value.charAt(1) == '.' && value.charAt(2) == '/') {
            let path = value.split("/");
            let counter = 0;
            for (let i=0; i<path.length; i++) {
                if (path[i] == '..') {
                    counter += 1;    
                } else {
                    break;
                }
            }
            let displayPath = location.split('/')
            let newPath = displayPath.slice(0, displayPath.length-counter).join('/');
            let splittedValue = value.split('/')
            let newValue = splittedValue.slice(counter).join('/');
            let fullPath = newPath + '/' + newValue;
            let transPath = fullPath.split("")
            
            let finalPath = newPath + '/' + newValue;
            return ['../', finalPath, newValue, newPath]
        } else if (value.charAt(0)=='.' && value.charAt(1) == "/") {
            let splittedValue = value.split('/');
            let newValue = splittedValue.slice(1).join('/');
            
            let finalPath = location + '/' +newValue;
            return ['./', finalPath, newValue]
        
        } else {
            let finalPath = location + '/' + value 
            return ['any', finalPath, value]
        }
    }

    handleGetFiles = (location, files) => {
        if (this.files) {
            this.files.forEach( file => {
                file.e = null;
                file.manager = null;
            } );
        }

        files.forEach(file => {
            file.manager = this;
            file.selected = false;
        });

        if (this.filter) {
            this.allFiles = files;
            this.files = files.filter( this.filter.filter );
        } else {
            this.files = files;
            this.allFiles = null;
        }

        this.location = { 
            drive: location.drive,  
            path: location.path,
            realPath: location.realPath
        };

        this.selectedCount = 0;

        console.log("In MANAGER ====>>",files);
        
        this.emit("files", { files: this.files, location: this.location, prevSubPath: location.previousSubPath } );
    }


    searchFile(filter, searchBack, fromNext) {
        const list = this.files;
        const count = list.length;
        const current = this.currentIndex;

        let i = current;

        this.filter = filter;

        if (searchBack) {
            if (fromNext) i--;

            while (i >= 0 && !filter.filter(list[i])) i--;

            if (i < 0) {
                i = count-1;
                while (i >= current && !filter.filter(list[i])) i--;
                if (i < current) i = -1;
            }

        } else {
            if (fromNext) i++;

            while (i < count && !filter.filter(list[i])) i++;

            if (i >= count) {
                i = 0;
                while (i <= current && !filter.filter(list[i])) i++;
                if (i > current) i = -1;
            }
        }

        if (i >= 0 && i < count) {
            this.emit("focusOn", i);
        }
    }

    setSearchOpen = ( onOff ) => {
        if (!onOff) {
            this.filter = null; 
        }

        this.searchActive = onOff;
        this.emit("searchOpen", onOff);
    }

    setFilter( filter ) {
        this.filter = filter;

        let newFiles;

        if (this.files)  {
            if (filter) {
                if (this.allFiles) {
                    newFiles = this.allFiles.filter( filter.filter );
                }  else {
                    this.allFiles = this.files;
                    newFiles = this.files.filter( filter.filter );
                }
            } else {
                newFiles = this.allFiles;
                this.allFiles = null;
            }
    
            if (newFiles) {
                this.files = newFiles;
                this.emit("files", { files: this.files, location: this.location, } );
            }
        }
        this.emit("setFilter", this.filter);
    }

    filterOff() {
        this.setFilter(null);
    }

    setHandler(handler) {
        if (this.driveHandler != handler) {
            this.driveHandler = handler;            
        }
        return this;
    }

    commandOpenDir = ({ file }) => {
        if (this.location.drive != 'googleDrive') {
            this.readFiles(file.name);
        } else {
            this.readFiles(file.fileId, false, file.name);
        }
    }

    commandOpenParentDir = (file) => {
        this.readFiles("..");

    }

    commandOpenRootDir = () => {
        this.readFiles("/");
    }

    commandOpenHomeDir = () => {
        this.readFiles("/~/");
    }

    commandInvertSelectionAll = () => {
        let newCount = 0;
        if (this.files) {
            this.files.forEach( file => {
                file.selected = !file.selected;

                if (file.selected) {
                    newCount ++;
                }
            });
        }
        this.emit("refresh");
        this.emit("selectedChange", newCount);
        this.emit("hasSelected", newCount != 0);
    }

    commandInvertSelectionFiles = () => {
        let newCount = 0;
        let changed = false;
        if (this.files) {
            this.files.forEach( file => {
                if (!file.isDir) {
                    file.selected = !file.selected;

                    changed = true;
                }

                if (file.selected) {
                    newCount ++;
                }
            });
        }
        if (changed) {
            this.emit("refresh");
            this.emit("selectedChange", newCount);
            this.emit("hasSelected", newCount != 0);
        }
    }


    commandOpenNewWindow = () => {
        const data = {
            window: {
                height: 200,
                width: 300,
                x: screen.width - 350,
                y: 50,
                thickFrame: true,
            },
            location: window.location.href,
        };

        console.log("NEW WINDOW: ", data);
        core.ipc.send("requestNewWindow", data);
    }

    commandQuickSearchNext = () => {
        if (this.filter) {
            this.searchFile(this.filter, false, true);
        }
    }

    commandQuickSearchPrevious = () => {
        if (this.filter) {
            this.searchFile(this.filter, true, true);
        }
    }

    commandToggleQuickSearch = () => {
        if (this.allFiles && this.filter) {
            this.setFilter(null);
        }
        this.emit("forceSearchOpen", !this.searchActive);
    }

    commandSetSearchFilter = () => {
        if (this.filter) {
            this.setFilter(this.filter);
        }
    }

    getCheckedFiles(files) {
        let checkedFiles = [];
        for (let i=0; i<files.length; i++) {
            if (files[i].selected) {
                checkedFiles.push({
                    name: files[i].name,
                    id: files[i].fileId
                });
            }
        }
        if (checkedFiles[0]){
            return checkedFiles;
        } else {
            return 'NOCHECK';
        }
    }


}

