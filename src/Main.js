//Node JS imports
import React, {Component} from 'react';
import { createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';
import FlexBand, { FlexBandItem } from 'flexband'
import ln3 from 'ln3';
import { teal, deepOrange, green, indigo, red } from '@material-ui/core/colors';
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex/dist/commonjs";
import { Tabs, Tab, IconButton, Snackbar, Dialog, DialogContent, DialogActions, DialogTitle, Typography, Button } from '@material-ui/core';
import {Close, MoreVert} from '@material-ui/icons';
import os from 'os';


// local imports
import OptionsDialog from './files/OptionsDialog';
import core from "./system/core";
import DrivePanel from "./files/DrivePanel";
import FileEditor from './files/FileEditor';
import DNTerminal from './files/terminal/Terminal';
import CloseConfirmDialog from './files/CloseConfirmDialog';
import AppHeader from './files/AppHeader';
import ChangeDriveDialog from './files/ChangeDriveDialog';
import KeyCommandsDialog from './files/KeyCommandsDialog';
import GoogleAccountDialog from './files/GoogleAccountDialog';
 
require("xterm/dist/xterm.css");
require("react-reflex/styles.css");

require("../fonts/roboto.css");   

const tabHeight = 36
const muiTheme = createMuiTheme({
    
    palette: {
        // primary1Color: teal[400], // indigo400,
        // primary2Color: teal[700], // indigo700,
        // accent1Color: deepOrange[500],
        // accent2color: green['A100'],
        primary: {
            main: '#03a9f4'
        }
    },
    overrides: {
        MuiDialog: {
            root: {
                color: 'white',
            },
            paper: {
                backgroundColor: '#37474F',
                color: 'white',
                width: '50%'
            }
        },
        MuiDialogTitle: {
            root: {
                color: '#ffffff',
            }
        },
        MuiDialogContent: {
            root: {
                color: '#ffffff',
            }
        },
        MuiFormControl: {
            root: {
                color: "#ffffff",
            },
            
        },
        MuiTabs: {
            root: {
                backgroundColor: '#777777',
                height: tabHeight
            },
            indicator: {
                // backgroundColor: red[500]
                backgroundColor: '#415059'
            }
        },
        MuiTab: {
            label: {
                color: '#ffffff'
            },
            selected: {
                backgroundColor: '#415059', 
            }
        },
        MuiInput: {
            focused: {
                color: '#000000'
            },
        }, 
        MuiRadio: {
            checked: {
                color: '#000000'
            } 
        },
        MuiMenu: {
            paper: {
                color: '#ffffff',
                backgroundColor: '#37474F'
            }
        },
        MuiMenuItem: {
            root: {
                color: '#ffffff',
            }
        },
        MuiTypography: {
            body1: {
                color: '#ffffff' 
            }
        }
    }
});

class Main extends Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            loading: true,
            activePart: "left",
            openOptionsDialog: false,
            fileEditMode: true,
            fileContent: '',
            tabs: [
                {
                    type: 'filePanel',
                    name: 'Files', 
                }
            ],
            tabValue: 'Files',
            terminalOn: false,
            openCloseConfirmDialog: false,
            openKeyCommandsDialog: false,
            openGoogleAccountDialog: false,
            isClosing: {},
            nextTerminalId: 1,
            startLocation: core.location,
            errorSnackbarMessage: '',
            openErrorSnackbar: false,
            drives: null,
            openChangeDrivesDialog: false,
            welcomeDialog: (localStorage.getItem("welcome"))? false:true
        };

        console.log("window SIZE: ", window);
        console.log("SCREEN object: ", screen);

    }

    componentDidMount() {
        console.log(core.location);
        core.ipc.send('getDrives');
        // let credentials = JSON.parse(localStorage.getItem("googleCredentials"));
        // if (credentials) {
        //     core.ipc.send('setToken', credentials.idToken);
        // }
        window.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("keyup", this.handleKeyUp);
        window.addEventListener("keypress", this.handleKeyPress);
        window.addEventListener("resize", () => {
            this.forceUpdate();
        })
        core.on("keyDown", this.handleSpecialKeyDown);
        core.on("keyUp", this.handleSpecialKeyUp);
        core.on('gotFileContent', this.handleEditFile);
        core.on('fileSaveAction', this.fileSaveAction);
        core.on('execBashFile', this.fileExecBash);
        core.on('displayError', this.handleOpenErrorSnackbar);
        core.on('openDrives', this.handleDrivesClick);
        core.on('handleChangeDrive', this.handleChangeDrive);
        core.ipc.on('getDrivesCallback', this.handleGetFiles);
        core.ipc.on('googleLogInCallback', this.handleGoogleLogInCallback);
        core.ipc.on('updateGoogleCredentials', this.handleUpdateGoogleCredentials);
        let defaultPath = JSON.parse(localStorage.getItem('defaultPath'));
        if (defaultPath && defaultPath.left.path && defaultPath.right.path) {
            core.location = defaultPath;
            this.setState({startLocation: core.location});
        }
    }

    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("keypress", this.handleKeyPress);
        window.removeEventListener("keyup", this.handleKeyUp);
        core.off("keyDown", this.handleSpecialKeyDown);
        core.off("keyUp", this.handleSpecialKeyUp);
        core.off('gotFileContent', this.handleEditFile);
        core.off('fileSaveAction', this.fileSaveAction);
        core.off('execBashFile', this.fileExecBash);
        core.off('displayError', this.handleOpenErrorSnackbar);
        core.off('openDrives', this.handleDrivesClick);
        core.ipc.removeListener('getDrivesCallback', this.handleGetFiles);  
        core.ipc.removeListener('googleLogInCallback', this.handleGoogleLogInCallback);     
        core.ipc.removeListener('updateGoogleCredentials', this.handleUpdateGoogleCredentials);

    }

    handleChangeDrive = (event, drive) => {
        
    }

    handleUpdateGoogleCredentials = (event, tokens) => {
        let credentials = JSON.parse(localStorage.getItem("googleCredentials"));

        credentials.tokens = tokens;

        localStorage.setItem("googleCredentials", JSON.stringify(credentials));
    }

    handleGoogleLogInCallback = (event, status, data) => {
        if (status != 'ERR') {
            localStorage.setItem("googleCredentials", JSON.stringify(data));
            core.emit('updateHeader');
        } else {
            core.emit('displayError', 'Log in attemt has failed');
        }
    }

    handleGetFiles = (event, status, data) => {
        if (status != 'ERR') {
            this.setState({drives: data});
            console.log(data);
        } else {
            console.log('Error: ', data)
        }
    }

    handleDrivesClick = () => {
        this.setState({
            openChangeDrivesDialog: !this.state.openChangeDrivesDialog,
        });
    }

    fileExecBash = (event, path) => {
        // let noCreate;
        // this.state.tabs.find((tab) => {
        //     if (tab.name == 'Terminal') {
        //         noCreate = true;
        //     }
        // })
        // if (noCreate) {
        //     this.setState({tabValue: 'Terminal'})
        // } else {
        // let terminalName = (this.state.nextTerminalId > 1)? 'Terminal ' + this.state.nextTerminalId: 'Terminal';
        // let tab = {
        //     name: terminalName,
        //     type: 'term',
        // }
        // this.state.tabs.push(tab);
        // this.setState({
        //     tabValue: 'Terminal',
        //     nextTerminalId: this.state.nextTerminalId + 1,
        // })
        // }
        // core.emit('termEmit', path)
    }

    handleOpenErrorSnackbar = (event, message) => {
        this.setState({
            errorSnackbarMessage: message,
            openErrorSnackbar: true,
        })
    }

    handleCloseErrorSnackbar = () => {
        this.setState({
            errorSnackbarMessage: '',
            openErrorSnackbar: false,
        })
    }

    fileSaveAction = (event, action) => {
        if (action == 'actioned') {
            this.closeTab(this.state.isClosing.name);
        } 
        this.setState({
            isClosing: {},
            openCloseConfirmDialog: false
        })
    }

    handleEditFile = (event, data, file, path) => {
        let noCreate;
        this.state.tabs.find((tab) => {
            if (tab.name == file.name) {
                noCreate = true;
            }
        })
        if (noCreate) {
            this.setState({tabValue: file.name});
        } else {
            let fileEdit = {
                type: 'fileEdit',
                name: file.name,
                data: data.toString(),
                path: path,
                fileExt: file.ext
            }
            this.state.tabs.push(fileEdit);
            this.setState({
                tabValue: file.name
            });
        }
        let language;
        if (file.ext == '.JS') {
            language = 'javascript'
        } else {
            language = 'text'
        }
    }

    handleKeyPress(event) {
        core.emit("keyPress", event);
    }

    handleKeyUp(event) {
        core.emit("keyUp", event);
    }

    handleKeyDown(event) {
        core.emit("keyDown", event);
    }

    handleSpecialKeyDown = (eventType, event) => {
        if (event.key === "Tab" && !core.dialogOpened) {
            event.preventDefault();
            if (this.state.activePart == "left") {
                this.setState({activePart: "right"})
            } else {
                this.setState({activePart: "left"})
            }
        } else if (event.key === "Shift") {
            core.isShiftPressed = true;
        } else if (event.key == "Control") {
            core.isControlPressed = true;
        } else if (event.key == "Alt") {
            core.isAltPressed = true;
        } else if (event.key == "Meta") {
            core.isMetaPressed = true;
        } else if (event.key == "F10" && this.state.fileEditMode) {
            this.setState({
                fileEditMode: false
            })
        }

        const cmd = core.keyMapper.mapKeyEvent(event, 'main');
        if (cmd) {
            switch (cmd.command) {
                // case 'openTerminal':
                    // let noCreate;
                    // this.state.tabs.find((tab) => {
                    //     if (tab.name == 'Terminal') {
                    //         noCreate = true;
                    //     }
                    // })
                    // if (noCreate) {
                    //     this.setState({tabValue: 'Terminal'})
                    // } else {
                    //     let terminalName = (this.state.nextTerminalId > 1)? 'Terminal ' + this.state.nextTerminalId: 'Terminal';
                    //     let tab = {
                    //         name: terminalName,
                    //         type: 'term',
                    //         id: this.state.nextTerminalId-1
                    //     }
                    //     this.state.tabs.push(tab);
                    //     this.setState({
                    //         tabValue: terminalName,
                    //         nextTerminalId: this.state.nextTerminalId + 1,
                    //     })
                    // }
                    // this.setState({terminalOn: !this.state.terminalOn});
                    // break;
                case 'openOptions':
                    this.handleOpenOptionsDialog();
                    break;
                default: 
                    console.log("There is no command assigned on this key combination");
            }
        }
        
    }

    handleSpecialKeyUp = (eventType, event) => {
        if (event.key === "Shift") {
            core.isShiftPressed = false;
        } else if (event.key == "Control") {
            core.isControlPressed = false;
        } else if (event.key == "Alt") {
            core.isAltPressed = false;
        } else if (event.key == "Meta") {
            core.isMetaPressed = false;
        } 
    }

    handleFocusRequest = ( partId ) => {
        this.setState({ activePart: partId })
    }

    handleOpenOptionsDialog = () => {
        this.setState({openOptionsDialog: !this.state.openOptionsDialog});
    }

    handleTabChange = (event, value) => {
        this.setState({tabValue: value});
    }

    handleEditorChange = (name, value) => {
        this.state.tabs.find((tab) => {
            if (tab.name == name) {
                tab.data = value;
            }
        })
    }

    handleGoogleLogIn = () => {
        core.ipc.send("googleLogIn");
    }

    closeTab = (fileName) => {
        this.state.tabs.forEach((tab, index)=> {
            if (tab.name == fileName) {
                this.state.tabs.splice(index, 1);
                this.setState({tabValue: 'Files'})
                this.forceUpdate();
            }
        });
    }

    handleCloseClick = (fileName, filePath, tabType) => {
        if (core.saveStatus[fileName] || tabType != 'fileEdit') {
            this.closeTab(fileName);
        } else {
            core.emit('getData', fileName);
            this.setState({
                openCloseConfirmDialog: true,
                isClosing: {
                    name: fileName,
                    path: filePath
                }
            })
        }
        if (tabType == 'term') {
            this.setState({nextTerminalId: this.state.nextTerminalId - 1});
        }
        
    }

    handleCloseWelcomeDialog = () => {
        this.setState({welcomeDialog: false});
        localStorage.setItem("welcome", 'true');
    }

    handleOpenKeyCommands = () => {
        this.setState({openKeyCommandsDialog: !this.state.openKeyCommandsDialog});
    }

    handleOpenGoogleAccountDialog = () => {
        this.setState({openGoogleAccountDialog: !this.state.openGoogleAccountDialog});
    }    

    render() {
        const sflStyle = {      
            height: "100%",
            minHeight: "100%",
            minWidth: "100%",
            backgroundColor: "#37474F",
            color: "#E8EAF6",
        };

        let { openGoogleAccountDialog } = this.state;

        return (
	        <MuiThemeProvider theme={muiTheme} >
                <Dialog open={this.state.welcomeDialog} onClose={this.handleCloseWelcomeDialog}>
                    <DialogTitle><span style={{color: '#ffffff'}}>{'Welcome to Dos Navigator III Alpha!'}</span></DialogTitle>
                    <DialogContent>
                        <Typography style={{color: '#ffffff'}}> 
                            We are happy to greet you on the alpha test of the Dos Navigator III! 
                            Yes, it's only alpha and we ask you to keep this in your mind while using our product. 
                            We hope you'll enjoy it!
                            If you'll meet some bug, please, tell us about it on our GitHub page.
                        </Typography>
                        <br />
                        <Typography style={{color: '#ffffff'}}>
                            Sincerely yours, Dos Navigator Team
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="raised" onClick={this.handleCloseWelcomeDialog}>Let's go!</Button>
                    </DialogActions>
                </Dialog>
                <div
                    className="layout-fill window-bk" 
                    style={{
                        height: '100%',
                        display: "block",
                    }}
                >
                    <Snackbar
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center'
                        }}
                        open={this.state.openErrorSnackbar}
                        autoHideDuration={2000}
                        onClose={this.handleCloseErrorSnackbar}
                        message={this.state.errorSnackbarMessage}
                        action={
                            <IconButton
                                onClick={this.handleCloseErrorSnackbar}
                            >
                                <Close />
                            </IconButton>
                        }
                    />
                    <KeyCommandsDialog
                        open={this.state.openKeyCommandsDialog}
                        onClose={this.handleOpenKeyCommands}
                    />
                    <ChangeDriveDialog 
                        open={this.state.openChangeDrivesDialog}
                        drives={this.state.drives}
                        onClose={this.handleDrivesClick}
                        activePart={this.state.activePart}
                    />
                    <OptionsDialog
                        open={this.state.openOptionsDialog}
                        onClose={this.handleOpenOptionsDialog}
                    />
                    <CloseConfirmDialog
                        open={this.state.openCloseConfirmDialog}
                        file={this.state.isClosing}
                    />
                    <GoogleAccountDialog
                        open={openGoogleAccountDialog}
                        onClose={this.handleOpenGoogleAccountDialog}
                    />
                    <AppHeader 
                        tabs={this.state.tabs}
                        tabValue={this.state.tabValue}
                        onChange={this.handleTabChange}
                        onCloseClick={this.handleCloseClick}
                        openOptions={this.handleOpenOptionsDialog}
                        openKeyCommands={this.handleOpenKeyCommands}
                        googleLogIn={this.handleGoogleLogIn}
                        openGoogleAccountDialog={this.handleOpenGoogleAccountDialog}
                    />
                    <div style={{height: window.innerHeight-tabHeight}}>
                        {this.state.tabs.map((tab, index) => {
                            return (
                                (tab.type == "filePanel")? (
                                    this.state.tabValue === tab.name && 
                                    <ReflexContainer key={index} orientation="vertical"  >
                                        <ReflexElement className="left-pane" minSize="400" >
                                            
                                            <DrivePanel
                                                openOptionsDialog={this.handleOpenOptionsDialog}
                                                isFocused={this.state.activePart === "left"}
                                                partId="left"
                                                location={this.state.startLocation.left}
                                                onFocusRequest={this.handleFocusRequest}
                                            />
    
                                        </ReflexElement>
                                        <ReflexSplitter />
                                        <ReflexElement className="right-pane" minSize="400">
                                        
                                                <DrivePanel
                                                    openOptionsDialog={this.handleOpenOptionsDialog}
                                                    isFocused={this.state.activePart === "right"}
                                                    partId="right"
                                                    location={this.state.startLocation.right}
                                                    onFocusRequest={this.handleFocusRequest}
                                                />
                                    
                                        </ReflexElement>
                                    </ReflexContainer>
                                ) : (tab.type == 'fileEdit') ? (
                                    this.state.tabValue === tab.name &&
                                    <FileEditor
                                        key={index}
                                        name={tab.name}
                                        data={tab.data}
                                        onChange={this.handleEditorChange}
                                        path={tab.path}
                                        fileExt={tab.fileExt}
                                    />
                                ) : (tab.type == 'term')?
                                (
                                        <DNTerminal 
                                            terminalId={tab.id}    
                                        />
                                ) : null
                            )
                        })}
                    </div>
                    
                </div>
                
            
            </MuiThemeProvider>
        );
    }
}

export default Main;
