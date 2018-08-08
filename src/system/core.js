import React, {Component} from 'react';
import axios from "axios";
import ObservedObject from 'observed-object';
import { ipcRenderer } from 'electron';
import ln3 from 'ln3';
import os from 'os';

import KeyMapper from './keys';

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

const shiftKeys = {
    Shift: true,
    Ctrl: true,
    Alt: true,
    Meta: true,
};

class Core extends ObservedObject {

    constructor (template) {
        super(template);

        try {
            this.ipc = ipcRenderer;

            if (this.onStartCreate) this.onStartCreate();

            this.axios = axios;
            this.ln3 = ln3;

            this.shiftKeys = shiftKeys;

            this.isDevelopment = window.location.href.search("localhost") >= 0;

            this.modelsLoaded = {};

            this.userValid = false;

            this.nullModel = { id: -1 };
            this.dummy = {};

            this.keyShift = 1;
            this.keyCtrl = 2;
            this.keyAlt = 4;
            this.keyMeta = 8;
            this.isShiftPressed = false;
            this.isControlPressed = false;
            this.isAltPressed = false;
            this.isMetaPressed = false;

            this.saveStatus = {

            }
            this.dialogOpened = false;
            
            this.pastingFiles = {
                files: [],
                action: ''
            }
            let disk =  (os.type == "Darwin" || os.type == "Linux")? '/':'C://'
            this.location = {
                left: {
                    drive: 'files',
                    disk: disk,
                    path: os.homedir(),
                },
                right: {
                    drive: 'files',
                    disk: disk,
                    path: os.homedir(),
                }
            }

            this.filePanelAvaibleModes = ['column', 'row'];
            this.filePanelMode = "column";

            this.selectedFiles = {
                left: 0,
                right: 0,
            }
            
            this.additionalOptionsList = [
                {
                    value: 'size',
                    label: 'Size'
                },
                {
                    value: 'modifyTime',
                    label: 'Last Modified'
                },
                {
                    value: 'createTime',
                    label: 'Create Time'
                },
                {
                    value: 'type',
                    label: 'File Type'
                },
                {
                    value: 'openTime',
                    label: 'Last Opened'
                }
            ]

            this.showCheckboxes = false;

            this.keyMapper = new KeyMapper();

        } catch (error) {

            if (this.onErrorCreate) this.onErrorCreate (error)

        } finally {

            if (this.onFinishCreate) this.onFinishCreate();
        }

    }
    /** 
     * Select or unselect file
     * @param {string} fileName Name of the file
    */
    // fileToSelected(fileName) {
    //     if (!this.selected[fileName]) {
    //         this.selected[fileName] = true;
    //     } else {
    //         this.selected[fileName] = false;
    //     }
    // }

    /**
     * Default API endpoint prefix, normally it is "/api/", but it may be overwritten if e.g. API versioning is used
     * 
     */
    apiPrefix() {
        return "/api/";
    }


    /**
     * An wrapper for calling API endpoints with POST method by specifying all Axios 
     * parameters. 
     * 
     * A Promise object is returned as a result with preset error handler. 
     */
    apiPost(url, params, ...other) {
        return axios.post(core.apiPrefix() + url, params, ...other);
    }

    // .catch( error => {
    //     if (this.onApiError){
    //         this.onApiError(error, {
    //             url: url,
    //             method: "GET",
    //             params: params,
    //             extra: other,
    //         });
    //     } else {
    //         console.warn("Unhandled API call error: ", error);
    //     }
    // } )    


    /**
     * An wrapper for calling API endpoints with GET method by specifying all Axios 
     * parameters. 
     * 
     * A Promise object is returned as a result with preset error handler. 
     */
    apiGet(url, params, ...other) {
        
        return axios.get(this.apiPrefix() + url, params, ...other);
    }


    /**
     * The default error handler which is supposed to handle all possible errors.
     * E.g. if an Authentication error is caught and a token authentication is used,
     * it is possible to try to refresh authentication token and continue to work
     * 
     * Generally, errors are very dependent on API implementation, so this hook must be 
     * overwritten more often than not
     * 
     */
    onApiError = (error, callData) => {
        console.warn("An error occurred while calling API endpoint", error);
    }

    /** 
    * a hook for returning user's default page depending on e.g. user type or even user name
    * note that adjustUserType is called before calling this hook, so an adjusted name is 
    * received here
    */
    userDefaultPage(actor) {
        return ""
    }


    /** 
     * a hook for adjusting user type depending on context 
    */
    adjustUserType(userType, userInfo) {
        return userType;
    }


    /**
    * a hook for returning user's default route name depending on e.g. user type or 
    * even user name note that adjustUserType is called before calling this hook, 
    * so an adjusted user type is received here
    */
    userTypeAsRoute(actor) {
        return actor;
    }


    /**
     *  Default method for loading Application's User object. 
     * 
     *  The code below is just an example of how it may be implemented. The key action is emitting 
     *  events such as "login" when stored authentication data is verified by the API and 
     * "loginRequired" when an authentication must be performed 
     *  
     */
    loadUser() {
        const needLogin = () => this.emit("loginRequired");

        if (this.loadUserCredentials()) {
            const self = this;
          
            this.apiGet('auth/user', {}).then((response) => {
                const data = response.data;

                if (data.authority) {
                    this.userInfo = data;
                    
                    this.emit("login", {
                        authenticated: true, 
                        userType: data.authority, 
                        userInfo: data,
                    });

                } else {
                    needLogin();
                }
            }).catch( error => {
                needLogin();
            });
                
        } else {
            needLogin();
        }
        
    }


    /**
     * Called when a user is authenticated by API, the "login" event must be emitted so the 
     * application's front-end gets notified 
     * 
     * Normally, authData must contain user name and the API response data 
     * 
     * @param {*} authData 
     */
    userAuthenticated(authData) {

    }

    loadUserCredentials(data) {
        let token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['X-Authorization'] = "Bearer " + token;
            return true;
        } 
        return false;
    }

    storeUserCredentials(data) {
        localStorage.setItem('token', data.token);
        axios.defaults.headers.common['X-Authorization'] = "Bearer " + data.token;
    }

    userLogin(credentials) {
        
        return this.apiPost(
            'auth/login', 
            credentials
        ).then( response => {
            const data = response.data;

            if (data) {
                console.log('Authenticated: ', data);
                
                this.storeUserCredentials(data);

                this.apiGet('auth/user', {}).then((response) => {
                    const data = response.data;
    
                    if (data.authority) {
                        this.userInfo = data;
                        
                        this.emit("login", {
                            authenticated: true, 
                            userType: data.authority, 
                            userInfo: data,
                        });
    
                    } else {
                        needLogin();
                    }
                });
    
            } 

        });
    } 


    logout() {

        if (this.userValid) {
            this.userValid = false;

            const {
                sessionId,
                privilegeId,
            } = this.user;

            this.user = new User();

            localStorage.lastSession = null;

            this.emit( "logout", null);

            axios.post('/api/logout', {
                session_id: sessionId,
            }).then((response)=>{
                const data = response.data;

                if (data && data.code > 0) {
                    console.log("logged off successfully");
                } else {
                    console.warn("An error while logging off: ", response.data);
                }
            }).catch((error)=>{
                console.warn("An error while logging off: ", error);
            });

        }

    }

    /** 
    * Changes file panel displayng mode: column or row
    */
    changeFilePanelMode() {
        // this.filePanelMode = 'row'
        for (let i = 0; i<this.filePanelAvaibleModes.length; i++) {
            if (this.filePanelAvaibleModes[i] == this.filePanelMode && i != this.filePanelAvaibleModes.length-1) {
                // console.log(this.filePanelAvaibleModes[i+1])
                this.filePanelMode = this.filePanelAvaibleModes[i+1]
                break;
            } else if (i == this.filePanelAvaibleModes.length-1) {
                this.filePanelMode = this.filePanelAvaibleModes[0]
            }
        }
    }

    scrollToElement(id) {
        const el = document.getElementById(id);

        if (el && el.scrollIntoView) {
            el.scrollIntoView();
        }
    }

    searchById(array, id) {
        return (array) ? (array.find((item) => (item.id == id))) : undefined;
    }

    eventKeyModifiers(event) {
        return (event.shiftKey ? this.keyShift : 0) + 
            (event.ctrlKey ? this.keyCtrl : 0) +
            (event.altKey ? this.keyAlt : 0) +
            (event.metaKey ? this.keyMeta : 0);
    }

}


var core = new Core();


export default core;


