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
        this.state = {
            location: props.location.path,
            path: '',
            pathError: true,
            label: '',
            manager: null,
            displayPath: props.location.path + '/',
            transPath:  '',
            transLocation: props.location.path
        }
    }

    componentDidMount() {
        core.on("getPanelManager", (event, manager) => {
            this.setState({manager: manager})
        })
        core.ipc.on('createDirectoryCallback', (event, status, path) => {
            if (status === 'success') {
                this.setState({
                    transLocation: this.state.location,
                    transPath: '',
                    path: ''
                })
                if (this.props.open){
                    this.props.onClose();
                }
            } else {
                this.setState({pathError: true});
                this.forceUpdate();
                if (status.code == "EEXIST") {
                    core.emit('displayError', 'This directory already exists');     
                }
            }
        })
    }
    
    componentWillReceiveProps() {
        this.setState({
            location: this.props.location.path,
            displayPath: this.props.location.path + '/',
            transLocation: this.props.location.path + '/'
        });

        if (this.state.path != ('' || null)) {
            let event = {target: {value: this.state.path}};
            this.handlePathChange(event);
        }
    }

    handlePathChange = (event) => {
        let value = event.target.value;

        this.setState({
            path: value,
            pathError: false,
            transLocation: this.state.location
        })

        if (this.state.manager) {
            let newPath = this.state.manager.reformatPath(value, this.state.location);
            if (newPath[0] == '/') {
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
            }
        }
        
    }

    handleCreateClick = () => {
        if (this.state.path == "" || !this.state.path) {
            this.setState({pathError: true});
        } else if (this.state.pathError) {
            this.setState({pathError: false});
        } else {
            core.ipc.send("createDirectory", this.state.transLocation, this.state.transPath);
        }
    }

   

    render() {
        let error = this.state.pathError;
        return (
            <Dialog open={this.props.open} onClose={this.props.onClose}>
                <DialogTitle> <span style={{color: '#ffffff'}}>{'Add directory'} </span> </DialogTitle>
                <DialogContent>
                    {/* {
                        (this.state.activePart === "left")? 
                        <Typography style={{color: '#ffffff',}}> {this.props.location[this.state.activePart].path + '/' + this.state.path} </Typography>:
                        <Typography style={{color: '#ffffff',}}> {this.props.location[this.state.activePart].path + '/' + this.state.path} </Typography> 
                                
                    } */}
                    <Typography style={{color: '#ffffff',}}> {this.state.displayPath} </Typography>
                    <TextField 
                        error={this.state.pathError} 
                        label="Enter path" 
                        fullWidth={true} 
                        onChange={this.handlePathChange} 
                        value={this.state.path} 
                        style={{color: '#ffffff'}} 
                    />
                </DialogContent>
                <DialogActions>
                    <Button style={{color: '#ffffff',}} onClick={this.props.onClose}> Cancel </Button>
                    <Button onClick={this.handleCreateClick} > Create </Button> 
                </DialogActions>
            </Dialog>
            
        )
    }
}