// Node JS imports 
import React, {Component} from 'react';
import ln3 from "ln3";
import FlexBand, { FlexBandItem } from "flexband";
import ObservedObject from "observed-object";
import PropTypes from "prop-types";
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex/dist/commonjs";
import { Paper } from '@material-ui/core';

// JS Files imports
import FilePanelManager from './Manager';
import FilePanel from './FilePanel';
import PathPanel from './PathPanel';
import { DriveContext } from "../common/Context";
import core from '../system/core';
import MakeDirDialog from './MakeDirDialog';
import RenMovDialog from './RenMovDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import CopyFileDialog from './CopyFileDialog';
import CreateFileDialog from './CreateFileDialog';

let nextPanelId = 1;

class MaskFilter {

    constructor(text) {
        if (text.startsWith("/")) {
            this.regExp = new RegExp(text.substr(1), 'i');
            this.filter = this.filterRegExp.bind(this);
        } else {
            this.text = text.toLocaleUpperCase();
            this.filter = this.filterText.bind(this);
        }
    }

    filterText(file) {
        const fname = file.name;
        return (fname && fname.toLocaleUpperCase().indexOf(this.text) >=0 ) ? true : false;
    }

    filterRegExp(file) {
        const fname = file.name;
        return (fname && this.regExp.test(fname));
    }

}


export default class DrivePanel extends Component {
    constructor (props, ...other) {
        super(props, ...other);
        this.state = {
            location: props.location,
            hasSelected: false,
            open: {
                mkDirDialog: false,
                renMovDialog: false,
                deleteConfirmDialog: false,
                createFileDialog: false,
                copyFileDialog: false,
            }
        };
        this.panelId = nextPanelId++;

        this.manager = new FilePanelManager(this.panelId, props.location);
    }

    componentDidMount() {
        this.manager.on("files", this.handleGetFiles);
        core.on('keyDown', this.handleKeyDown);
        core.on('driveChanged', this.handleDriveChanged);
        core.ipc.on('directoryUpdate', this.handleDirectoryUpdate);
    }

    componentWillUnount() {
        this.manager.off("files", this.handleGetFiles);
        core.off('driveChanged', this.handleDriveChanged);
        core.off('keyDown', this.handleKeyDown);
    }

    handleDriveChanged = (event, activePart) => {
        if (activePart == this.props.partId) {
            this.manager.readFiles(core.location[this.props.partId].disk, true);
        }
    }

    handleDirectoryUpdate = (event, dir) => {
        if (dir == this.state.location.path) {
            this.manager.readFiles();
        }
    }

    handleKeyDown = () => {
        if (this.props.isFocused) {
            const cmd = core.keyMapper.mapKeyEvent(event, 'drivePanel');
            // console.log(cmd);
            if (cmd) {
                switch (cmd.command) {
                    case 'makeDir':
                        this.handleOpenDialog('mkDirDialog');
                        core.emit("getPanelManager", this.manager);
                        break;
                    case 'createFile':
                        this.handleOpenDialog('createFileDialog');
                        core.emit("getPanelManager", this.manager);
                        break;
                    default: 
                        console.log("There is no command assigned on this key combination");
                }
            }
        }
    }

    handleGetFiles = (event, data) => {
        this.setState({ location: data.location });
        core.location[this.props.partId] = data.location
        core.emit('currentLocationChange', this.props.partId);
        this.forceUpdate();
    }

    handleOpenMkDirDialog = () => {
        this.setState({openMkDirDialog: !this.state.openMkDirDialog});
    }

    handleOpenRenMovDialog = () => {
        this.setState({openRenMovDialog: !this.state.openRenMovDialog});
    }

    handleDeleteConfirm = () => {
        this.setState({openDeleteConfirm: !this.state.openDeleteConfirm});
    }

    handleFilterChange = (text, filter) => {
        if (this.filterTimer) {
            clearTimeout( this.filterTimer );
            this.filterTimer = 0;
        }

        if (text) {
            const filter = new MaskFilter(text);
            this.manager.filter = filter;

            this.filterTimer = setTimeout(() => {
                this.manager.searchFile( this.manager.filter );

            }, 500);
        } else {
            this.manager.filterOff();
        }
    }

    handleOpenCopyDialog = () => {
        this.setState({openCopyFileDialog: !this.state.openCopyFileDialog});
    }

    handleOpenCreateDialog = () => {
        this.setState({openCreateFileDialog: !this.state.openCreateFileDialog})
    }

    handleOpenDialog = (dialog) => {
        if (dialog) {
            this.state.open[dialog] = !this.state.open[dialog];
            core.dialogOpened = !core.dialogOpened;
            this.forceUpdate();
        } 
    }

    render() {
        const {
            location,
            hasSelected,
        } = this.state;

        const props = this.props;

        return (
            <DriveContext.Consumer orientation="vertical">
                { drives => (
                        <ReflexContainer>
                            <ReflexElement  flex={0.05} className="panel-bk" style={{ minHeight: "2em" , overflow: 'hidden'}} >
                                <PathPanel 
                                    location={ location }  
                                    manager={ this.manager }
                                    panelId={ this.panelId }
                                    isFocused={ props.isFocused }
                                    onFocusRequest={ () => {
                                        if (props.onFocusRequest) {
                                            props.onFocusRequest(props.partId)
                                        }
                                    } }
                                    onFilterChange={ this.handleFilterChange }
                                />
                            </ReflexElement>
                            <ReflexElement >
                                <ReflexContainer orientation="horizontal">
                                    <CreateFileDialog
                                        open={this.state.open.createFileDialog}
                                        onClose={(() => {this.handleOpenDialog('createFileDialog')})}
                                        location={location}
                                    />
                                    <MakeDirDialog 
                                        open={this.state.open.mkDirDialog} 
                                        onClose={(() => {this.handleOpenDialog('mkDirDialog')})}
                                        location={location}
                                    />
                                    <CopyFileDialog
                                        open={this.state.open.copyFileDialog}
                                        onClose={(() => {this.handleOpenDialog('copyFileDialog')})}
                                        location={location}
                                        panelId={this.props.partId}
                                    />
                                    <RenMovDialog
                                        open={this.state.open.renMovDialog}
                                        onClose={(() => {this.handleOpenDialog('renMovDialog')})}
                                        location={location}
                                    />
                                    <DeleteConfirmDialog
                                        open={this.state.open.deleteConfirmDialog}
                                        onClose={(() => {this.handleOpenDialog('deleteConfirmDialog')})}
                                        panelId={this.panelId}
                                        panelName={props.partId}
                                        location={location}
                                    />
                                    <FilePanel
                                        openActionDialog={this.handleOpenDialog}
                                        isFocused={ props.isFocused }
                                        defaultLocation={ location }
                                        onFocusRequest={ () => {
                                            if (props.onFocusRequest) {
                                                props.onFocusRequest(props.partId)
                                            }
                                        } }
                                        hasSelected={hasSelected}
                                        manager={ this.manager.setHandler( drives && drives.handlers ? drives.handlers[ location.drive ] : null ) }
                                        panelId={ this.panelId }
                                        partId={ props.partId }
                                        driveHandler={ drives && drives.handlers ? drives.handlers[ location.drive ] : null }
                                    />
                                    
                                </ReflexContainer>
                            </ReflexElement>
                            
                        </ReflexContainer>
                  )  }
                  
            </DriveContext.Consumer>
        );
    }
}
