const axios = require('axios');
const qs = require('querystring');
const { parse } = require('url');

const core = require('./app-core');
const { store, ipcMain } = core;

const GOOGLE_AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token';
const GOOGLE_PROFILE_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_REDIRECT_URI =  'http://localhost:8880'; //'com.dosnavigator.app';
const GOOGLE_CLIENT_ID = '749480666427-tjqpjhh1rieuetnmq83ph7sn5tn88ung.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = 'DS9gtsvFUO0G7NR4f9377vnT';
const GOOGLE_FOLDER = 'application/vnd.google-apps.folder'

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
};

// const googleDrive = google.drive({
//     version: "v3",
//     auth: "749480666427-tjqpjhh1rieuetnmq83ph7sn5tn88ung.apps.googleusercontent.com"
// })
// let spawn;
// try {
//     spawn = pty.spawn
// } catch (err) {
//     throw createNodePtyError();
// }


let refreshTimeout;
async function googleSignIn(parent) {
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


    // parent.webContents.send("googleLogInCallback", status, providerUser);
}

function signInWithPopup(parent) {
    return new Promise((resolve, reject) => {
        // TODO: position window relatively to parent 
        const authWindow = new BrowserWindow({
            width: 500,
            height: 600,
            show: true,
            parent,
        });
  
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

function checkGoogleStatus(parent) {
    const { webContents } = parent;

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

        webContents.send("getGoogleStatusCallback", "LOGGED", credentials);
    } else {
        webContents.send("getGoogleStatusCallback", "NOT LOGGED", credentials);
    }
}

async function getGoogleDriveFile(entity, file) {
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
};

function reformatGoogleDriveFiles(filesList) {
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
};


ipcMain.on("getGoogleStatus", () => {
    checkGoogleStatus();
});

ipcMain.on("googleLogOut", () => {
    store.delete("googleCredentials");
    
    checkGoogleStatus();
});

ipcMain.on("createGDriveDirectory", (event, parent, dir, updateDir) => {
    const { webContents } = event.sender;
    console.log("NAME: ", dir);
    axios.post("https://www.googleapis.com/drive/v3/files", {
        name: dir,
        mimeType: GOOGLE_FOLDER,
        parents: [parent]
        
    }).then(response => {
        webContents.send("createDirectoryCallback", 'success', null);
        webContents.send("directoryUpdate", updateDir)
    })
});

ipcMain.on("deleteGDriveFiles", async (event, files, path) => {
    const { webContents } = event.sender;
    // const credentials = JSON.parse(store.get("googleCredentials"));
    // const {access_token, refresh_token} = credentials.tokens;

    for (let i=0; i<files.length; i++) {
        console.log(files[i].id);
        await deleteGoogleDriveFile(files[i].id);
    }

    webContents.send("directoryUpdate", path);
    webContents.send("deleteFilesCallback", 'SUCCESS');
});

ipcMain.on('copyGDriveFiles', async (event, updatePath, {path, drive}, files) => {
    const { webContents } = event.sender;

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
        webContents.send('copyFilesCallback', 'ERR', err);
    }
    

    webContents.send('copyFilesCallback', 'SUCCESS');
    webContents.send("directoryUpdate", updatePath);
});

ipcMain.on('googleLogIn', async (event) => {
    await googleSignIn(event.sender).then(e => {
        // console.log('OKAY')
        checkGoogleStatus();
    });
});

ipcMain.on('getGDriveFiles', async (event, { sender, location, fromHomeDir}) => {
    const { webContents } = event.sender;

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
            webContents.send("getGDriveFilesCallback", sender, location, files);
        })
        // .catch(async err => {
            
        //     webContents.send("openDriveCallback", data);
        // });

});

