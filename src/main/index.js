const electron = require('electron');
const {webContents, ipcMain} = electron;
const path = require('path');

const os = require('os');
const fs = require("fs");
const rimraf = require('rimraf');
const ncp = require('ncp').ncp;
const trash = require('trash');
const childProccess = require('child_process');

const drivelist = require('drivelist');

let usbDetect = require('usb-detection');

const core = require('./app-core');
const { store } = core;

// const {google} = require("googleapis");
let FormData = require("form-data");
// let Blob = require("blob")


ncp.limit = 16;

const fileTypes = require("../files/FileTypes");

const app = electron.app;

const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;

let mainWindow = null;

let fileWatchers = {};

const { isDev } = core;

console.log("Running environment: ", isDev ? "DEV" : "PROD");
console.log('APP PATH --->>> ', core.appPath());
console.log('loading from ', core.appUrl());

usbDetect.startMonitoring();

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1500, 
        height: 900,
        title: 'Dos Navigator III',
        icon: '../../icons/logo.png',
        webPreferences: {
            nodeIntegration: true,
        },
      
    })

    mainWindow.loadURL(core.appUrl());

    if (isDev) {
        mainWindow.webContents.toggleDevTools();
    }

    mainWindow.on('closed', () => { mainWindow = null; });
}


const windowsExeTypes = {
    ".EXE": true,
    ".CMD": true,
    ".BAT": true,
    ".MSI": true,
    ".MSP": true,
    ".ISU": true,
    ".CPL": true,
    ".COM": true,
    ".JOB": true,
    ".VBS": true,
    ".VB": true,
    ".JS": true,
    ".JSR": true,
    ".PIF": true,
    ".SHS": true,
    ".SCT": true,
    ".WS": true,
    ".WSF": true,
    ".WSH": true,
    ".VBSCRIPT": true,
};

const archiveTypes = {

}

const canRunWindows = (fileName, ext, mode) => (windowsExeTypes[ext]);

let canRun = canRunWindows;

let logs = {};
let terminals = {
};

switch (os.platform()) {
    case 'aix': 
        break;

    case 'darwin': 
        break;

    case 'freebsd': 
        break;

    case 'linux': 
        break;

    case 'openbsd': 
        break;

    case 'sunos': 
        break;

    case 'win32': 
        break;

}

const getDrives = () => {
    drivelist.list().then(drives => {
        console.log('DRIVES ---> ', drives);
        if (mainWindow) {
            mainWindow.webContents.send('getDrivesCallback', 'SUCCESS', drives);
        }
    }).catch (err => {
        // todo: make error handling better
        console.log('DRIVE ERROR - ', err);
        mainWindow.webContents.send('getDrivesCallback', 'ERR', err);
    });
}

usbDetect.on('add', () => {
    let timeout = setTimeout(() => {
        getDrives();
    }, 3000);
});

usbDetect.on('change', () => {
    let timeout = setTimeout(() => {
        getDrives();
    }, 3000);
});

usbDetect.on('remove', () => {
    getDrives();
});


ipcMain.on("requestNewWindow", (event, data) => {
    console.log("NEW WINDOW: ", data);
    const newWindow = new BrowserWindow(
        data.window,
    );

    newWindow.loadURL(data.location);
} );

ipcMain.on("createDirectory", (event, location, path) => {
    console.log('Location: ', location);
    console.log('Path: ', path);
    if (path.charAt(0) != '/') {
        let dirs = path.split('/');
        let nextPath = '';
        let errors = false;
        for (let i=0; i<dirs.length; i++) {
            try {
                fs.mkdirSync(location + '/' + nextPath + dirs[i]);
            } catch(e) {
                mainWindow.webContents.send("createDirectoryCallback", e, dirs[i]);
                errors = true;
                return;
            }
            nextPath += dirs[i] + '/'; 
        }
        if (!errors) {
            mainWindow.webContents.send("createDirectoryCallback", 'success', null);
        }
    } else {
        let dirs = path.split('/');
        let nextPath = '';
        let errors = false;

        for (let i=1; i<dirs.length; i++) {
            try {
                fs.mkdirSync('/' + nextPath + dirs[i]);
            } catch(e) {
                mainWindow.webContents.send("createDirectoryCallback", e, dirs[i]);
                errors = true;
                return;
            } 
            nextPath += dirs[i] + '/'; 
        }
        if (!errors) {
            mainWindow.webContents.send("createDirectoryCallback", 'success', null);
        }
    }
})

ipcMain.on('renMov', (event, prevLocation, nextLocation) => {   
    fs.rename(prevLocation, nextLocation, (e) => {
        if (e) {
            mainWindow.webContents.send("renMovCallback", e, nextLocation);
        } else {
            mainWindow.webContents.send("renMovCallback", 'success', null);
        }
    });
})

ipcMain.on('deleteFiles', (event, files, path, perm) => {
    if (!perm) {
        console.log(path);

        for (let i=0; i<files.length; i++) {
            let dir = path + '/' + files[i].name;
            trash(dir).then(() => {
                mainWindow.webContents.send("deleteFilesCallback", 'SUCCESS');
            }).catch((err) => {
                mainWindow.webContents.send("deleteFilesCallback", 'ERR', err);
            })
        }
    } else {
        try {
            for (let i=0; i<files.length; i++) {
                let dir = path + '/' + files[i].name;
                rimraf(dir, (err) => {
                    if (err) {
                        throw err;
                    }
                })
            }
            mainWindow.webContents.send("deleteFilesCallback", 'SUCCESS');
        } catch (err) {
            mainWindow.webContents.send("deleteFilesCallback", 'ERR', err);
        }
    }
        
    

})

ipcMain.on('readFileContent', (event, path) => {
    fs.readFile(path, 'utf8', (err, data) => {
        if (!err) {
            mainWindow.webContents.send("readFileContentCallback", 'SUCCESS', data);
        } else {
            mainWindow.webContents.send("readFileContentCallback", 'ERR', err);
        }
    })
})

ipcMain.on('saveFile', (event, path, data) => {
    fs.writeFile(path, data, (err) => {
        if (err) {
            mainWindow.webContents.send('saveFileCallback', 'ERR', err);
        } else {
            mainWindow.webContents.send('saveFileCallback', 'SUCCESS');
        }
    })
})

ipcMain.on('createFile', (event, path) => {
    fs.writeFile(path, '', (err) => {
        if (err) {
            mainWindow.webContents.send('createFileCallback', 'ERR', err);
        } else {
            mainWindow.webContents.send('createFileCallback', 'SUCCESS');
        }
    })
})

const mimeTypesByExt = {
    ".DOCX": "application/msword",
    ".JS": "application/javascript",
    ".JSON": "application/json",
    ".XLSX": "application/vnd.ms-excel",
    ".JPG": "image/jpeg",
    ".PNG": "image/png",
    ".SVG": "image/svg+xml",
    ".PPTX": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
}

ipcMain.on('copyFiles', async (event, oldPath, {path, drive}, files) => {
    if (drive == "googleDrive") {
        console.log("INIT PATH: ", path);
        let sTo = path.split("/");
        console.log("SPLITTED: ", sTo);
        let parent = sTo[sTo.length - 1];
        console.log("PARENT NAME: ", parent);

        let parentTo;
        if (parent == "root") {
            parentTo = parent
        } else {
            parentTo = await getGoogleDriveFile("name", parent);
        }

        for (let i = 0; i < files.length; i++) {
            let file = files[i];

            let fileContent = fs.readFileSync(oldPath + "/" + file.name)
            
            let mimeType;

            if (mimeTypesByExt[file.ext]) {
                mimeType = mimeTypesByExt[file.ext];
            } else {
                mimeType = "text/plain"
            }

            let fileSend = {
                data: Buffer.from(fileContent).toString(),
                mimeType: mimeType
            }

            let metadata = {
                name: file.name,
                mimeType: mimeType,
                parents: [parentTo],
            }

            let accessToken = JSON.parse(store.get("googleCredentials")).tokens.access_token;

            mainWindow.webContents.send("createFormData", metadata, fileSend, accessToken, path);
        }
        
        mainWindow.webContents.send('copyFilesCallback', 'SUCCESS');
    } else {
        for (let i = 0; i < files.length; i++) {
            let file = files[i].name
            console.log(file)
            ncp(oldPath + "/" + file, path + "/" + file, (err) => {
                if (err) {
                    // console.log(err);
                    mainWindow.webContents.send('copyFilesCallback', 'ERR', err);
                } else {
                    mainWindow.webContents.send('copyFilesCallback', 'SUCCESS');
                }
            })
        }
    }
})

ipcMain.on('fastCopyFile', (event, files, newPath, action) => {
    try {
        files.forEach((file) => {
            ncp(file.path+'/'+file.name, newPath+'/'+file.name, (err) => {
                if (err) {
                    throw err;
                }
            })
        })
        mainWindow.webContents.send('fastCopyFileCallback', action);
    } catch(err) {
        mainWindow.webContents.send('fastCopyFileCallback', 'ERR', err);
    }
    
})

ipcMain.on('execFile', (event, path) => {
    try {
        childProccess.execFile(path, (err) => {
            if (err) {
                throw err;
            } else {
                mainWindow.webContents.send('execFileCallback', 'SUCCESS');
            }
        })
    } catch (err) {
        mainWindow.webContents.send('execFileCallback', 'ERR', err);
    }
})

ipcMain.on('getDrives', (event) => {
    getDrives();
})

// iterateFiles = (files) => {
//     let ids = {}

//     files.forEach(file => {
//         if (file.mimeType == 'application/vnd.google-apps.folder') {
//             // const fileParent = await getFileData
//             ids[file.id] = {
//                 children: [],
//                 parentId: ((file.parents && file.parents[0])? file.parents[0]:null),
//                 file: file
//             };
//             console.log(ids[file.id]);
//         }
        
//     })

//     // console.log(ids);

//     files.forEach((file, id) => {
//         if (file.parents && file.parents[0] && file.mimeType != 'application/vnd.google-apps.folder') {
//             let parentFile = ids[file.parents[0]];
//             if (parentFile) {
//                 // console.log(parentFile.childer)

//                 parentFile.children.push(file);
//                 files.splice(id, 1);
//             }
//         }
//     })

//     let finallyFiles = [];

//     let pFiles = iterateParentFiles(ids);



//     for (let file in pFiles) {
//         if (pFiles[file] != null) {
//             console.log("I'm broking here: finallyFiles")
//             finallyFiles.push(pFiles[file]);
//         }
//     }

//     finallyFiles.concat(files);
    
//     return finallyFiles;
// }

// iterateParentFiles = (files) => {
//     let forDeleting = [];
//     for (let file in files) {
//         let fFile = files[files[file].parentId];
//         if (fFile) {
//             // fFile.children.push(files[file]);
//             console.log("I'm broking here: iterateParentFiles")
//             forDeleting.push(file);
//         } 
//     }

//     forDeleting.forEach(file => {
//         files[file] = null;
//     })

//     return files;
// }

ipcMain.on("needFiles", (event, data) => {
    const {
        sender,
        location,
        fromHomeDir
    } = data;

    

    let dir = location.path;
    const add = location.addToPath;
    
    console.log("Get FILES: ", dir);
    if (fromHomeDir) {
        dir = add
        location.path = dir
    } else {
        if (add) {
            try {
                fileWatchers[dir].close();
                fileWatchers[dir] = null;
            } catch(err) {
                console.log(err);
            }
            switch (add) {
                case "..": 
                    location.previousSubPath = path.basename(dir);
                    dir = path.dirname(dir);
                    break;
                case "/~/":
                    dir = os.homedir();
                    break;
                case "/":
                    if (os.platform() === "win32") {
                        if (dir.length >= 2) {
                            const parsed = path.parse(path.normalize(dir))    
                            const newDir = parsed.root;
                            if (dir === newDir) {
                                // Here, we should go to root of all drives
                            } else {
                                dir = newDir;
                            }
                        } else {
                            // Here, we should go to root of all drives
                        }
                    }
                    break;
                default:
                    dir = path.join(dir, add);
            }
            console.log("NEW DIR is ", dir);
            location.path = dir;
        }
    }
        
    fs.readdir(dir, (err, files) => {
        
        const list = files ?  files.map( f => ({ name: f, ext: path.extname(f) }) ) : [];

        let stats, ext, name;

        list.forEach(f => {
            try { 
                name = f.name;
                ext = path.extname(name).toUpperCase();
                f.ext = ext;
                f.sort = 100000;

                stats = fs.statSync( path.join(dir, name) );

                f.openTime = stats.atime;
                f.mode = stats.mode;
                f.isDir = stats.isDirectory();
                f.size = stats.size;
                f.createTime = stats.birthtime;
                f.modifiedTime = stats.mtime;
                f.canRun = stats.isFile() && canRun(name, ext, stats.mode);

                fileTypes.find( ft => {
                    if (ft.test(f)) {
                        f.type = ft.id;
                        f.sort = ft.sort;
                        return true;
                    }
                    return false;
                });
                
                // f.isFile = stats.isFile();
            } catch (e) {
                // ... nothing yet
            }
            
        });

        list.sort( (file1, file2) => {
            let res = file1.sort - file2.sort;

            if (res === 0) {
                res = file1.name.localeCompare(file2.name);
            }

            return res;
        });
        
        if (!fileWatchers[dir] || fileWatchers[dir] == null) {
            fileWatchers[dir] = fs.watch(dir, (event, file) => {
                if (file) {
                    console.log(file);
                    mainWindow.webContents.send("directoryUpdate", dir);
                }
            })
        }

        mainWindow.webContents.send("getFiles", sender, location, list, err);
    } );

} );


app.on('ready', createWindow);

app.on('before-quit', () => {
    usbDetect.stopMonitoring();
})


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

