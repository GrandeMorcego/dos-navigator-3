const electron = require('electron');
const {webContents, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const os = require('os');
const fs = require("fs");
// const express = require("express");
// const pty = require("node-pty")
// const expApp = express()
// const expressApp = require("express-ws")(expApp)
const rimraf = require('rimraf');
const ncp = require('ncp').ncp;
const trash = require('trash');
const childProccess = require('child_process');
const drivelist = require('drivelist');
const simpleGit = require('simple-git/promise');
let usbDetect = require('usb-detection');

// let spawn;
// try {
//     spawn = pty.spawn
// } catch (err) {
//     throw createNodePtyError();
// }
ncp.limit = 16;

const fileTypes = require("./files/FileTypes");

const app = electron.app;

const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;

let mainWindow = null;

let fileWatchers = {};

const isDev = (process.env.NODE_ENV + " ").toLowerCase().startsWith("dev") ;

console.log("Running environment: ", isDev ? "DEV" : "PROD");

usbDetect.startMonitoring();

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1500, 
        height: 900,
        title: 'Dos Navigator III',
        icon: '../icons/logo.png'
    })

    mainWindow.loadURL(isDev ? "http://localhost:8888" : `file://${__dirname}/../build/index.html`, { });

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
    drivelist.list((err, drives) => {
        if (err) {
            mainWindow.webContents.send('getDrivesCallback', 'ERR', err);
        } else {
            mainWindow.webContents.send('getDrivesCallback', 'SUCCESS', drives);
        }
    })
}

usbDetect.on('add', () => {
    let timeout = setTimeout(() => {
        getDrives();
    }, 3000);
})



usbDetect.on('change', () => {
    let timeout = setTimeout(() => {
        getDrives();
    }, 3000);
})

usbDetect.on('remove', () => {
    getDrives();
})

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

ipcMain.on('deleteFiles', (event, files, path) => {
    console.log(files);
    for (let i=0; i<files.length; i++) {
        let dir = path + '/' + files[i];
        trash(dir).then(() => {
            mainWindow.webContents.send("deleteFilesCallback", 'SUCCESS');
        }).catch((err) => {
            mainWindow.webContents.send("deleteFilesCallback", 'ERR', err);
        })
    }

})

ipcMain.on('deleteFilesPerm', (event, files, path) => {
    console.log(files);
    try {
        for (let i=0; i<files.length; i++) {
            let dir = path + '/' + files[i];
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

ipcMain.on('copyFile', (event, oldPath, newPath) => {
    ncp(oldPath, newPath, (err) => {
        if (err) {
            mainWindow.webContents.send('copyFileCallback', 'ERR', err);
        } else {
            mainWindow.webContents.send('copyFileCallback', 'SUCCESS');
        }
    })
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

ipcMain.on("needFiles", (event, data) => {
    const {
        sender,
        location,
        fromHomeDir
    } = data;

    

    let dir = location.path;
    const add = location.addToPath;
    const git = simpleGit(dir);
    
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

        simpleGit(dir).checkIsRepo().then((isRepo) => {
            console.log('File is repo ', isRepo);
            
            mainWindow.webContents.send("getFiles", sender, location, list, {isRepo}, err);
        })
    } );

} );

ipcMain.on('getRepoStatus', (event, dir) => {
    simpleGit(dir).status().then((status) => {
        console.log(status);
        mainWindow.webContents.send("getRepoStatusCallback", status);
    });
})

ipcMain.on('gitPullRepo', (event, repo) => {
    simpleGit(repo.path).pull('origin', repo.status.current).then((status) => {
        console.log(status);
        mainWindow.webContents.send("gitPullRepoCallback", status);
    }).catch((err) => {
        console.log(err);
    })


});

ipcMain.on('gitCommitRepo', (event, repo, message) => {
    console.log(message, ' ', repo.path);
    let files = [];

    repo.status.files.forEach((file) => {
        files.push(file.path);
    })
    
    simpleGit(repo.path).add(repo.status.not_added).then((status) => {
        console.log(status);
        simpleGit(repo.path).commit(message, files).then((status) => {
            console.log(status);
            mainWindow.webContents.send("gitCommitRepoCallback", status);
        }).catch((err) => {
            console.log(err);
        })
    }).catch((err) => {
        console.log(err);
    })
    
})

ipcMain.on('gitPushRepo', (event, repo) => {
    simpleGit(repo.path).push('origin', repo.status.current).then((status) => {
        console.log(status);
        mainWindow.webContents.send("gitPushRepoCallback", status);
    }).catch((err) => {
        console.log(err);
    })
})

ipcMain.on('gitCloneRepo', (event, repoPath, dir, name) => {
    simpleGit(dir).clone(repoPath, dir + '/' + name).then((status) => {
        console.log(status);
        mainWindow.webContents.send("gitCloneRepoCallback", status);
    }).catch((err) => {
        console.log(err);
        mainWindow.webContents.send("gitCloneRepoCallback", err, true);
    })
})

// expApp.get("/test", (req, res) => {
//     res.send('Express is open');
// })

// expApp.post('/api/openTerminal', (req, res) => {
//     var term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
//         name: 'dn-term',
//         // cols: 80,
//         // rows: 40,
//         cwd: process.env.HOME,
//         env: process.env,
//         encoding: 'utf-8'
//     });
//     terminals[term.pid] = term
//     // terminal = term;
    
//     term.on("data", (data) => {
//         logs[term.pid] += data;
//     })
//     res.send(term.pid.toString());
//     res.end();
// })

// expApp.ws('/terminal/:pid', (ws, req) => {
//     let terminal = terminals[parseInt(req.params.pid)]
//     terminal.on('data', (data) => {
//         try {
//             ws.send(data)
//         } catch(err) {
//             console.log(err)
//         }
//     });

    

//     ws.on('message', (msg) => {
//         terminal.write(msg);
//     });

//     ws.on("close" , () => {
//         terminal.kill();
//         terminal = null;
//         console.log('I am here');
//     })
// })

// expApp.listen(3030);

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

