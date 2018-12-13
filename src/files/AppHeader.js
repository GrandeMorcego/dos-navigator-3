// Node JS imports
import React, {Component} from 'react';
import { Tabs, Tab, IconButton, Tooltip, CircularProgress, Paper, Grow, MenuList, MenuItem, ClickAwayListener, Menu } from '@material-ui/core';
import { Close, MoreVert, CloudDownload } from '@material-ui/icons';
import FlexBand, { FlexBandItem } from 'flexband'

// JS Files imports
import core from '../system/core';


const tabHeight = 36;

export default class AppHeader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menuOpen: false,
            itemMenu: null,
            fsProgress: 0,
            fsOperatingFiles: [],
            openProgressMenu: false
        }
        this.timeout;
        this.updateTime = 0;
    }

    componentDidMount() {
        core.on('updateHeader', () => this.forceUpdate());
        core.ipc.on("sendProgress", this.handleSendProgress);
        core.ipc.on("copyFilesCallback", this.handleFullProgress);
        core.on("getCopyingFilesHeader", this.handleSetFiles);
    }

    componentWillUnmount() {
        core.off('updateHeader', () => this.forceUpdate());
    }

    handleFullProgress = () => {
        this.setState({fsProgress: 100})
    }

    handleSetFiles = (event, files) =>{
        this.setState({fsOperatingFiles: files});
    }

    handleSendProgress = (event, path, fileIndex, progress, overallProgress, overallSize) => {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        let countedProgress = 0;
        for (let i = 0; i < overallProgress.length; i++) {
            countedProgress += overallProgress[i]
        }
        let percentage = (countedProgress/overallSize)*100
        
        if (this.updateTime == 0) {
            this.updateTime = Date.now();
            console.log("UPDATE TIME: ", this.updateTime);
            this.timeout = setTimeout(() => {
                let file = this.state.fsOperatingFiles[fileIndex]
                file.progress = progress.completedSize/file.size;
                
                this.setState({
                    fsProgress: percentage,
                    fsOperatingFiles: this.state.fsOperatingFiles
                });
                
                console.log("COPYING SIZE: ", overallProgress, overallSize, "timeout");
            }, 1500);
        } else if (Date.now() >= this.updateTime + 500) {
            // console.log("UPDATE TIME: ", this.updateTime);
            this.setState({fsProgress: percentage});
            console.log("COPYING SIZE: ", overallProgress, overallSize, "count");
            this.updateTime = 0;
        }
    }

    handleCloseClick(tabName, tabPath, tabType) {
        if (this.props.onCloseClick) {
            this.props.onCloseClick(tabName, tabPath, tabType);
        }
    }

    handleClickMenu = (event) => {
        this.setState({menuOpen: !this.state.menuOpen, itemMenu: event.currentTarget});
    }

    propHandler(prop, event) {
        this.setState({ menuOpen: false });
        const handler = this.props[prop];
        if (handler) {
            handler(event);
        }
    }

    handleOpenOptions = event => this.propHandler("openOptions", event);

    handleOpenKeyCommands = event => this.propHandler("openKeyCommands", event);

    handleGoogleLogIn = event => this.propHandler("googleLogIn", event);

    handleOpenGoogleAccountDialog = event => this.propHandler("openGoogleAccountDialog", event);

    handleOpenProgressMenu = () => {
        this.setState({openProgressMenu: !this.state.openProgressMenu})
    }
    
    render() {
        // let googleCredentials = JSON.parse(localStorage.getItem("googleCredentials"));
        const { googleCredentials } = this.props;
        const { fsProgress, menuOpen, itemMenu, openProgressMenu, fsOperatingFiles } = this.state;
        return (
            <FlexBand wrap="nowrap" style={{height: tabHeight}} >
                <FlexBandItem style={{ width: '90%'}}>
                    <Tabs 
                        scrollButtons={'off'} 
                        scrollable={true} 
                        value={this.props.tabValue} 
                        onChange={this.props.onChange} 
                    >
                        {this.props.tabs.map((tab, index) => {
                            return [
                                <Tab key={index} label={tab.name} value={tab.name} style={{height: tabHeight}} />,
                                
                                (tab.name != 'Files')?<Close onClick={(() => (this.handleCloseClick(tab.name, tab.path, tab.type)))} style={{position: 'relative', top: 6, right: 30}}/>:null
                            ]
                        })}
                    </Tabs>
                    
                </FlexBandItem>
                <FlexBandItem style={{
                    backgroundColor: '#777777',
                    width: '10%',
                }}>
                    <FlexBand wrap="nowrap" className="justify-content-end">
                        <FlexBandItem>
                            {/* <Tooltip title="Update avaible">
                                <IconButton
                                    style={{
                                        width: 36,
                                        height: 36,
                                    }}
                                >
                                    <CloudDownload 
                                        style={{
                                            fill: '#ffffff',
                                            
                                        }} 
                                    />
                                </IconButton>
                            </Tooltip> */}
                            <Tooltip title={Math.round(fsProgress) + '%'}>
                                <IconButton
                                    style={{
                                        width: 36,
                                        height: 36
                                    }}
                                    onClick={this.handleOpenProgressMenu}
                                >
                                    <CircularProgress
                                        variant="static"
                                        style={{
                                            width: 36,
                                            height: 36
                                        }}
                                        value={fsProgress}
                                    />
                                </IconButton>
                            </Tooltip>
                            <Paper
                                hidden={!openProgressMenu}
                                id="progress-menu"
                                style={{
                                    position: "absolute",
                                    overflow: "auto",
                                    minHeight: 100,
                                    maxHeight: 400,
                                    width: 100,
                                    zIndex: 400
                                    
                                }}
                            >
                                {fsOperatingFiles.map((file) => (
                                    <div>
                                        {file.name}
                                        {file.progress}
                                    </div>
                                ))}

                            </Paper>
                            
                            
                            
                        </FlexBandItem>
                        <FlexBandItem>
                            <Tooltip title="Properties">
                                <IconButton
                                    style={{
                                        width: 36,
                                        height: 36,
                                    }}
                                    aria-owns="props-menu"
                                    aria-haspopup="true"
                                    onClick={this.handleClickMenu}
                                >
                                    <MoreVert 
                                        style={{
                                            fill: '#ffffff',
                                            
                                        }} 
                                    />
                                </IconButton>
                            </Tooltip>
                            <Menu open={menuOpen} onClose={this.handleClickMenu} id={menuOpen?"props-menu":null} anchorEl={itemMenu}>                                    
                                <MenuItem onClick={ this.handleOpenOptions }> Preferences </MenuItem>
                                <MenuItem onClick={ this.handleOpenKeyCommands }> Key commands </MenuItem> 
                                {(googleCredentials && googleCredentials.displayName)?
                                    <MenuItem onClick={ this.handleOpenGoogleAccountDialog }> {googleCredentials.displayName} </MenuItem>:
                                    <MenuItem onClick={  this.handleGoogleLogIn }> Log in to Google </MenuItem>}
                            </Menu>
                        </FlexBandItem>
                    </FlexBand>
                </FlexBandItem>
            </FlexBand>
        );
    }
}