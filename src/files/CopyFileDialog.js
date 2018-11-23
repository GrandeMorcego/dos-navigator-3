// Node JS imports
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, RadioGroup, Radio, FormControl, FormControlLabel, FormLabel, Typography } from '@material-ui/core';
import { createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';

// JS Files imports
import core from '../system/core';
import FilePanelManager from './Manager';

export default class MakeDirDialog extends React.Component {
    constructor(props) {
        super(props);
        let nextPanel = (this.props.panelId == "left")? 'right':'left'

        this.state = {
            path: '',
            nextPanel: nextPanel,
            pathError: false,
            label: '',
            errorMessage: '',
            manager: null,
            displayPath: core.location[nextPanel].path,
            transPath:  '',
            transLocation: core.location[nextPanel].path,
            file: null,
        }
    }

    componentDidMount() {
        core.on("getPanelFile", this.handleGetFile);

        core.on('currentLocationChange', this.handleLocationChange);

        core.ipc.on('copyFileCallback', (event, status, err) => {
            if (status === 'SUCCESS') {
                this.setState({
                    transLocation: core.location[this.state.nextPanel].path + (core.location[this.state.nextPanel].path == "/")? '/': '',
                    transPath: '',
                    path: ''
                })
                if (this.props.open){
                    this.props.onClose();
                }
            } else {
                console.log('ERR: ', err);
            }
        })
    }

    handleGetFile = (event, manager, file) => {
        console.log('Got FILE: ', file);
        this.setState({
            manager: manager,
            file: file
        });
        this.forceUpdate();
    }

    handleLocationChange = (event, part) => {
        if (part != this.props.panelId) {
            this.setState({
                displayPath: core.location[this.state.nextPanel].path,
                transLocation: core.location[this.state.nextPanel].path
            })
        }
    }

    handlePathChange = (event) => {
        let value = event.target.value;
        this.setState({
            path: value,
            pathError: false,
            errorMessage: '',
            transLocation: core.location[this.state.nextPanel].path
        })

        if (this.state.manager) {
            let newPath = this.state.manager.reformatPath(value, core.location[this.state.nextPanel].path);

            if (newPath[0] == 'root') { 
                this.setState({
                    displayPath: value,
                    transPath: value,
                })
            } else if (newPath[0] == '../') {
                this.setState({
                    displayPath: newPath[1],
                    transPath: newPath[2],
                    transLocation: newPath[3]
                })
            } else if (newPath[0] == './') {
                this.setState({
                    displayPath: newPath[1],
                    transPath: newPath[2]
                });
            } else if (newPath[0] == 'any') {
                this.setState({
                    displayPath: newPath[1],
                    transPath: value
                })
            } else if (newPath[0] == "ERR") {
                this.setState({
                    pathError: true,
                    errorMessage: newPath[1]
                })
            }
        } else if (this.props.location.drive == "googleDrive") {        
            this.setState({
                transPath: value
            }) 
        }
    }

    handleCopyClick = () => {
        let { path, pathError, transLocation, file, transPath, manager } = this.state;
        if (!pathError) {
            let from = core.location[this.props.panelId].path + '/' + file.name;
            let iFile = (path == "" || !path)? file.name:transPath;
            let to = transLocation + '/' + iFile
            console.log(from, to);
            if (manager) {
                manager.copyFiles(from, to);
            }
        }
        
    }

   

    render() {
        return (
            <Dialog open={this.props.open} onClose={this.props.onClose}>
                <DialogTitle> <span style={{color: '#ffffff'}}>{'Copy File'} </span> </DialogTitle>
                <DialogContent>
                    {(this.state.file)? <Typography style={{color: '#ffffff'}}> {this.props.location.path + '/' + this.state.file.name} </Typography>:null}
                    <Typography style={{color: '#ffffff',}}> {this.state.displayPath} </Typography>
                    <TextField 
                        error={this.state.pathError} 
                        label={(this.state.pathError)? this.state.errorMessage : 'Enter path'}
                        fullWidth={true} 
                        onChange={this.handlePathChange} 
                        value={this.state.path} 
                        style={{color: '#ffffff'}} 
                    />
                </DialogContent>
                <DialogActions>
                    <Button style={{color: '#ffffff',}} onClick={this.props.onClose}> Cancel </Button>
                    <Button onClick={this.handleCopyClick} > Copy </Button> 
                </DialogActions>
            </Dialog>
            
        )
    }
}