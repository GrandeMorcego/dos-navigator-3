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
let usbDetect = require('usb-detection');
const axios = require('axios');
const qs = require('querystring');
const {parse} = require('url');
const Store = require("electron-store");
const store = new Store();
const cpy = require("cpy");
const getFolderSize = require("get-folder-size");

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

const GOOGLE_AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token';
const GOOGLE_PROFILE_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_REDIRECT_URI =  'http://localhost:8880'; //'com.dosnavigator.app';
const GOOGLE_CLIENT_ID = '749480666427-tjqpjhh1rieuetnmq83ph7sn5tn88ung.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = 'DS9gtsvFUO0G7NR4f9377vnT';
const GOOGLE_FOLDER = 'application/vnd.google-apps.folder'

let refreshTimeout;
async function googleSignIn() {
    const code = await signInWithPopup();
    const tokens = await fetchAccessTokens(code, 'authorization_code');

    console.log(tokens);

    const {id, email, name} = await fetchGoogleProfile(tokens.access_token);
    
    // const { id, email, name } = response;

    const providerUser = {
        uid: id,
        email: email,
        displayName: name,
        tokens: tokens
    };
    providerUser.expiringTime = Math.floor(Date.now()/1000) + 3570;
    
    providerUser.refresh_token = tokens.refresh_token;

    let status = '';

    if (providerUser.tokens.id_token) {
        store.set("googleCredentials", JSON.stringify(providerUser));
    }


    // mainWindow.webContents.send("googleLogInCallback", status, providerUser);
}

signInWithPopup = () => {
    return new Promise((resolve, reject) => {
        // const authWindow = new remote.BrowserWindow({
        //     width: 500,
        //     height: 600,
        //     show: true,
        // })

        const authWindow = new BrowserWindow({
            width: 500,
            height: 600,
            show: true,
            parent: mainWindow
        })
  
      // TODO: Generate and validate PKCE code_challenge value
        const urlParams = {
            response_type: 'code',
            redirect_uri: GOOGLE_REDIRECT_URI,
            client_id: GOOGLE_CLIENT_ID,
            access_type: "offline",
            scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.photos.readonly https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
        }
        const authUrl = `${GOOGLE_AUTHORIZATION_URL}?${qs.stringify(urlParams)}`
  
        handleNavigation = (url) => {
            const query = parse(url, true).query
            if (query) {
                if (query.error) {
                    reject(new Error(`There was an error: ${query.error}`))
                } else if (query.code) {
                    // Login is complete
                    authWindow.removeAllListeners('closed')
                    setImmediate(() => authWindow.close())

                    // This is the authorization code we need to request tokens
                    resolve(query.code)
                }
            }
        }
  
    //   authWindow.on('closed', () => {
    //     // TODO: Handle this smoothly
    //     throw new Error('Auth window was closed by user')
    //   })
    
        authWindow.webContents.on('will-navigate', (event, url) => {
            handleNavigation(url);
        })
  
        authWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
            handleNavigation(newUrl);
        })

        authWindow.loadURL(authUrl);
    })
}

async function fetchAccessTokens (code, grantType) {
    const response = await axios.post(GOOGLE_TOKEN_URL, qs.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: grantType,
    }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })

    return response.data
}

async function fetchGoogleProfile (accessToken) {
    const response = await axios.get(GOOGLE_PROFILE_URL, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
    })
    return response.data
}

async function refreshGoogleAccessToken () {
    const credentials = JSON.parse(store.get('googleCredentials'));

    console.log("refresh_token: ", credentials.expiringTime);

    const response = await axios.post(GOOGLE_TOKEN_URL, qs.stringify({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: credentials.refresh_token
    }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    })
    credentials.expiringTime = Math.floor(Date.now()/1000) + 3570;
    credentials.tokens = response.data;
    store.set("googleCredentials", JSON.stringify(credentials));
}

async function getGoogleDriveData(query) {
    // const accessToken = credentials.tokens.access_token

    // const {access_token} = JSON.parse(store.get('googleCredentials'));

    let response = await axios.get("https://www.googleapis.com/drive/v3/files", {
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${access_token}`,
        },
        params: {
            key: GOOGLE_CLIENT_ID,
            fields: 'files,incompleteSearch,kind,nextPageToken',
            q: query,
            orderBy: 'folder,name',
        }
    }).catch(async err => {
        // if (err) {
        //     console.log(err.response);
        //     await refreshGoogleAccessToken();
        //     checkGoogleStatus();
        //     const data = await getGoogleDriveData(query);
        //     response = data;
        // }
    })

    if (response) {
        return response.data;
    }
}

async function deleteGoogleDriveFile(fileId) {
    let response = await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${accessToken}`,
        },
    }).catch(async err => {
        await refreshGoogleAccessToken();
        checkGoogleStatus();
        const data = await deleteGoogleDriveFile(fileId);
        response = data;
    })

    if (response) {
        return response.data;
    }
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
        if (mainWindow) {
            if (err) {
                mainWindow.webContents.send('getDrivesCallback', 'ERR', err);
            } else {
                mainWindow.webContents.send('getDrivesCallback', 'SUCCESS', drives);
            }
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

ipcMain.on("getGoogleStatus", () => {
    checkGoogleStatus();
});

const checkGoogleStatus = () => {
    const credentials = store.get("googleCredentials");
    if (credentials) {
        let parsedCredentials = JSON.parse(credentials);
        let accessToken = parsedCredentials.tokens.access_token;

        clearTimeout(refreshTimeout);

        console.log("EXPIRING TIME: ", parsedCredentials.expiringTime - Math.floor(Date.now()/1000));
        refreshTimeout = setTimeout(() => {
            refreshGoogleAccessToken();
        }, parsedCredentials.expiringTime*1000 - Date.now());

        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        mainWindow.webContents.send("getGoogleStatusCallback", "LOGGED", credentials);
    } else {
        mainWindow.webContents.send("getGoogleStatusCallback", "NOT LOGGED", credentials);
    }
}

ipcMain.on("googleLogOut", () => {
    store.delete("googleCredentials");
    
    checkGoogleStatus();
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

ipcMain.on("createGDriveDirectory", (event, parent, dir, updateDir) => {
    console.log("NAME: ", dir);
    axios.post("https://www.googleapis.com/drive/v3/files", {
        name: dir,
        mimeType: GOOGLE_FOLDER,
        parents: [parent]
        
    }).then(response => {
        mainWindow.webContents.send("createDirectoryCallback", 'success', null);
        mainWindow.webContents.send("directoryUpdate", updateDir)
    })
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

ipcMain.on("deleteGDriveFiles", async (event, files, path) => {
    // const credentials = JSON.parse(store.get("googleCredentials"));
    // const {access_token, refresh_token} = credentials.tokens;

    for (let i=0; i<files.length; i++) {
        console.log(files[i].id);
        await deleteGoogleDriveFile(files[i].id);
    }

    mainWindow.webContents.send("directoryUpdate", path);
    mainWindow.webContents.send("deleteFilesCallback", 'SUCCESS');
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
        let overallSize = 0;
        let overallProgress = [];
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            if (file.isDir) {
                getFolderSize(oldPath + '/' + file.name, (err, size) => {
                    if (!err) {
                        overallSize += size;
                    }
                })
            } else {
                overallSize += file.size;
            }
        }

        console.log(overallSize);
        for (let i = 0; i < files.length; i++) {
            let file = files[i].name;
            console.log(file)
            // ncp(oldPath + "/" + file, path + "/" + file, (err) => {
            //     if (err) {
            //         // console.log(err);
            //         mainWindow.webContents.send('copyFilesCallback', 'ERR', err);
            //     } else {
            //         mainWindow.webContents.send('copyFilesCallback', 'SUCCESS');
            //     }
            // })
            let apply = (files[i].isDir)? '/' + file:""

            // await cpy(oldPath + '/' + file, path + apply, {parents: true, nodir: false}).on("progress", (progress) => {
            //     // console.log(progress);
            //     overallProgress[i] = progress.completedSize;
            //     mainWindow.webContents.send("sendProgress", oldPath, i, progress, overallProgress, overallSize);
            // }).then(() => {
            //     console.log("Files copied: ", file);
            // })

            copyFile({path: oldPath, name: file}, path);
        }

        mainWindow.webContents.send('copyFilesCallback', 'SUCCESS');
    }
})

const cpFile = ({path, name}, dest) => {

}

const copyFile = ({path, name}, dest, progress) => {
    let from = path + "/" + name;
    let to = dest + "/" + name;
    let sendProgress;

    if (!progress) {
        sendProgress = 0;
    }
    let stats = fs.statSync(from);
    let isDir = stats.isDirectory();
    let size = stats.size;
    

    if (isDir) {
        fs.mkdirSync(to);

        fs.readdir(from, (err, files) => {
            if (!err) {
                for (let i = 0; i < files.length; i++) {
                    copyFile({path: from, name: files[i]}, to, sendProgress);
                }
            }
        })
    } else {
        let fileData = fs.readFileSync(from);
        let writingFile = fs.createWriteStream(to);
        writingFile.write(Buffer.from(fileData), () => {
            console.log("COPIED");
        });

        let interval = setInterval(() => {
            console.log("ALREADY WRITTEN ===>>> ", writingFile.bytesWritten);
            if (writingFile.bytesWritten >= size) {
                clearInterval(interval);
            }
        }, 2000);
    }
}

const googleDocsTypes = {
    "application/vnd.google-apps.document": {
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ext: ".docx"
    },
    "application/vnd.google-apps.drawing": {
        mimeType:"image/png",
        ext: ".png"
    },
    "application/vnd.google-apps.script": {
        mimeType:"application/vnd.google-apps.script+json",
        ext: ".json"
    },
    "application/vnd.google-apps.spreadsheet": {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ext: ".xslx"
    },
    "application/vnd.google-apps.presentation": {
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ext: ".pptx"
    }
}

ipcMain.on('copyGDriveFiles', async (event, updatePath, {path, drive}, files) => {
    
    try {
        if (drive == "googleDrive") {
            let sTo = path.split("/");
            let parent = sTo[sTo.length - 1];

            const parentTo = await getGoogleDriveFile("name", parent);
            
            console.log("TO GOOGLE DRIVE", files);

            for (let i = 0; i < files.length; i++) {
                let file = files[i].id;
                    await axios.post(`https://www.googleapis.com/drive/v3/files/${file}/copy`, {
                        parents: [parentTo],
                        name: files[i].name
                    }).catch(err => {
                        throw err;
                    })
                
            }
        } else {
            console.log("TO FILE DRIVE", files);
            writeFile = (response, file, ext) => {
                console.log(typeof(Buffer.from(response.data, "binary")));
                fs.writeFile(path + "/" + file + ext, Buffer.from(response.data, "binary"), (err) => {
                    if (err) {
                        throw err;
                    }
                });
            }

            for (let i = 0; i < files.length; i++) {
                let file = files[i]

                let query;
                let ext = "";
                let type = googleDocsTypes[file.mimeType];
                if (type) {
                    query = {
                        endpoint: `https://www.googleapis.com/drive/v3/files/${file.id}/export`,
                        data: {
                            mimeType: type.mimeType,
                        }

                    }
                    ext = type.ext
                } else {
                    query = {
                        endpoint: `https://www.googleapis.com/drive/v3/files/${file.id}`,
                        data: {
                            alt: "media",
                        }
                    }
                }

                await axios.get(query.endpoint, {          
                    params: query.data,
                    responseType: "arraybuffer"
                }).then(response => {
                    writeFile(response, file.name, ext);
                }).catch(err => {
                    throw err;
                })          
            }
        }
    } catch (err) {
        mainWindow.webContents.send('copyFilesCallback', 'ERR', err);
    }
    

    mainWindow.webContents.send('copyFilesCallback', 'SUCCESS');
    mainWindow.webContents.send("directoryUpdate", updatePath);
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

ipcMain.on('googleLogIn', async (event) => {
    await googleSignIn().then(e => {
        // console.log('OKAY')
        checkGoogleStatus();
    });
});

ipcMain.on('getGDriveFiles', async (event, { sender, location, fromHomeDir}) => {

    const credentials = JSON.parse(store.get("googleCredentials"));
    const {
        access_token,
        refresh_token
    } = credentials.tokens;

    let key;
    
    if (location.addToPath === '..') {
        let parent = location.realPath.split('/')
        key = parent[parent.length-2]
    } else if (!location.addToPath) {
        let parent = location.realPath.split('/')
        key = parent[parent.length-1]
    } else {
        key = fromHomeDir? 'root' : location.addToPath; 
    }

    console.log('KEY: ', key);
    
    getGoogleDriveData(`'${key}' in parents`)
        .then(async response  =>  {
            let files = reformatGoogleDriveFiles(response.files);
            
            if (location.addToPath != '..') {
                location.path = fromHomeDir? 'gdrive://root': location.addToPath?location.path + `/${location.fileName}`:location.path
                location.realPath = fromHomeDir? 'root': location.addToPath? location.realPath + `/${key}`: location.realPath
            } else {
                let parent = location.path.split('/')
                parent.splice(parent.length-1,);
                location.path = parent.join('/');
                let rParent = location.realPath.split('/')
                rParent.splice(rParent.length-1,);
                location.realPath = rParent.join('/');
            }
            mainWindow.webContents.send("getGDriveFilesCallback", sender, location, files);
        })
        // .catch(async err => {
            
        //     mainWindow.webContents.send("openDriveCallback", data);
        // });

} )

getGoogleDriveFile = async (entity, file) => {
    let response;
    let fileFinal;
    if (entity == 'id') {
        response = await axios.get(`https://www.googleapis.com/drive/v3/files/${file}`, {
            params: {
                key: GOOGLE_CLIENT_ID,
            }
        }).catch(async err => {
            console.log('ERROR IN files.get');
            const token = await refreshGoogleAccessToken();
            getGoogleDriveFile('id', file);
        });
        
        if (response) {
            fileFinal = response.data.name;
        }
    } else if (entity == 'name') {
        response = await getGoogleDriveData(`name='${file}'`);

        console.log('DONE')

        console.log('FILES: ', response.files);
        if (response.files && response.files[0]) {
            fileFinal = response.files[0].id;
        }
    }
     

    return fileFinal
}

reformatGoogleDriveFiles = (filesList) => {
    let reFiles = [];

    filesList.forEach((file, id) => {
        let reFile = {
            name: file.name,
            parentId: file.parents[0],
            createTime: file.createdFile,
            isDir: (file.mimeType == 'application/vnd.google-apps.folder')? true : false,
            ext: (file.fileExtension)? '.' + file.fileExtension.toUpperCase():null,
            modifiedTime: file.modifiedTime,
            openTime: file.viewedByMe,
            size: (file.size)?file.size:null,
            fileId: file.id,
            mimeType: file.mimeType
        }

        reFiles.push(reFile);
    })

    return reFiles;
}

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

