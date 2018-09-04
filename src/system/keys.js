import core from './core';


export default class KeyMapper {

    keyMap = [

        { key: "Enter", command: "openFile", where: "filePanel", when: "!commandLine && fileSelected && !dirSelected && !searchActive" },
        { key: "Enter", command: "openDir", where: "filePanel", when: "!commandLine && dirSelected && !searchActive" },
        { key: "Enter", command: "setSearchFilter", where: "filePanel", when: "searchActive" },
        { key: "Ctrl+Enter", command: "quickSearchNext", where: "filePanel", when: "searchActive" },
        { key: "Ctrl+Shift+Enter", command: "quickSearchPrevious", where: "filePanel", when: "searchActive" },

        { key: "F", command: "toggleQuickSearch", where: "filePanel", when: "!searchActive && !commandLine" },
        { key: "Escape", command: "toggleQuickSearch", where: "filePanel", when: "searchActive" },

        { key: "Ctrl+/", command: "openRootDir", where: "filePanel", when: ""},
        { key: "Ctrl+Shift+?", command: "openHomeDir", where: "filePanel", when: ""},
        { key: "Ctrl+PageUp", command: "openParentDir", where: "filePanel", when: "" },
        { key: "Ctrl+PageDown", command: "openDir", where: "filePanel", when: "fileSelected && dirSelected" },
        { key: "Alt+ArrowUp", command: "openParentDir", where: "filePanel", when: "" },
        { key: "Alt+ArrowLeft", command: "dirBack", where: "filePanel", when: "" },
        { key: "Alt+ArrowRight", command: "dirForward", where: "filePanel", when: "" },
        { key: "Alt+ArrowDown", command: "selectDrive", where: "filePanel", when: "" },

        { key: "Shift+ArrowUp", command: "selectFileUp", where: "filePanel", when: ""},
        { key: "Shift+ArrowDown", command: "selectFileDown", where: "filePanel", when: ""},
        { key: "Shift+ArrowLeft", command: "selectColumnLeft", where: "filePanel", when: "" },
        { key: "Shift+ArrowRight", command: "selectColumnRight", where: "filePanel", when: "" },
        { key: "Insert", command: "selectFileDown", where: "filePanel", when: ""},
        { key: "Ctrl+=", command: "selectFilesByType", where: "filePanel", when: ""},
        { key: "Ctrl+-", command: "deselectFilesByType", where: "filePanel", when: ""},
        { key: "Ctrl+Shift+*", command: "invertSelectionAll", where: "filePanel", when: ""},
        { key: "Ctrl+*", command: "invertSelectionFiles", where: "filePanel", when: ""},
        { key: "Ctrl+Shift++", command: "selectFilesByColor", where: "filePanel", when: ""},
        { key: "Ctrl+Shift+_", command: "deselectFilesByColor", where: "filePanel", when: ""},
        { key: "Ctrl+p", command: "openOptions", where: "main", when: ""},
        { key: "Meta+p", command: "openOptions", where: "main", when: ""},
        { key: "Meta+t", command: "openGitMenu", where: 'gitPanel', when: ""},      
        { key: "Ctrl+t", command: "openGitMenu", where: 'gitPanel', when: ""},      

        { key: "F5", command: "copyFile", where: "filePanel", when: ""},
        { key: "Shift+F5", command: "copyCurrent", where: "filePanel", when: ""},
        { key: "F6", command: "move", where: "filePanel", when: ""},
        { key: "Shift+F6", command: "moveCurrent", where: "filePanel", when: ""},
        { key: "F7", command: "makeDir", where: "drivePanel", when: ""},
        { key: "Alt+F7", command: "find", where: "filePanel", when: ""},
        { key: "F8", command: "delete", where: "filePanel", when: ""},
        { key: "Shift+F8", command: "deleteCurrent", where: "filePanel", when: ""},
        { key: "F3", command: "viewFile", where: "filePanel", when: ""},
        { key: "F4", command: "editFile", where: "filePanel", when: ""},
        { key: "Shift+F4", command: "createFile", where: "drivePanel", when: ""},
        
        { key: "Ctrl+1", command: "changePanelMode", where: "filePanel", when: ""},

        { key: "Ctrl+F1", command: "openNewWindow", where: "filePanel", when: ""},

        { key: "Meta+s", command: 'saveFile', where: "fileEdit", when: ""},
        { key: "Ctrl+s", command: 'saveFile', where: "fileEdit", when: ""},
        { key: "Meta+o", command: 'openTerminal', where: 'main', when: ""},
        { key: "Ctrl+o", command: 'openTerminal', where: 'main', when: ""},
        { key: "Ctrl+c", command: 'fastCopyFile', where: 'filePanel', when: ""},
        { key: "Meta+c", command: 'fastCopyFile', where: 'filePanel', when: ""},  
        { key: "Ctrl+x", command: 'fastCutFile', where: 'filePanel', when: ""},
        { key: "Meta+x", command: 'fastCutFile', where: 'filePanel', when: ""},  
        { key: "Ctrl+v", command: 'pasteFile', where: 'filePanel', when: ""},
        { key: "Meta+v", command: 'pasteFile', where: 'filePanel', when: ""},        

        
    ];

    loadMap() {
        const keyDict = {};

        this.keyMap.forEach( key => {
            const keyName = key.key.toUpperCase();
            let mapping = keyDict[keyName];
            if (mapping) {
                mapping.push(key);
            } else {
                keyDict[keyName] = [ key ];
            }
        } );

        this.keyDict = keyDict;
    }

    eventToKey(event) {
        let keyName = event.key;

        if (keyName) {
            keyName = ((event.metaKey) ? "Meta+" : "") +
                    ((event.altKey) ? "Alt+" : "") +
                    ((event.ctrlKey) ? "Ctrl+" : "") + 
                    ((event.shiftKey) ? "Shift+" : "") + 
                    keyName;
            return keyName;
        } else return null;
    }


    mapKeyEvent( event, where, context ) {
        return this.mapKeyName(this.eventToKey(event), where, context);    
    }

    mapKeyName( keyName, where, context ) {
        if (!this.keyDict) {
            this.loadMap();
        }

        const mapping = this.keyDict[ keyName.toUpperCase() ];
        if (!core.dialogOpened) {
            if (mapping) {
                const cmd = mapping.find( key => {
                    if (where === key.where) {
                        if (key.when) {
                            if (context && typeof context === 'object') {
                                const {
                                    fileSelected,
                                    dirSelected,
                                    commandLine,
                                    searchActive,
                                    dialogOpened,
                                    gitIsFocused
                                } = context;
                                if (!gitIsFocused) {
                                    return eval(key.when);
                                }
                            }
                            return eval(key.when);
                        } else {
                            return true;
                        }
    
                    }
                } );
                return cmd;
            }
        }
       
    }
}