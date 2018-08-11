// Node JS imports
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, RadioGroup, Radio, FormControl, FormControlLabel, FormLabel, Typography } from '@material-ui/core';
import { createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';

// JS Files imports
import core from '../system/core';
import FilePanelManager from './Manager';

export default class CreateFileDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            location: props.location.path,
            path: '',
            pathError: false,
            errorMessage: '',
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
        core.ipc.on('createFileCallback', (event, status, err) => {
            if (status === 'SUCCESS') {
                core.dialogOpened = false;
                if (this.props.open){
                    this.props.onClose();
                    let nameSplitted = this.state.transPath.split('.');
                    let ext = '.'+nameSplitted[nameSplitted.length - 1].toUpperCase();
                    let file = {
                        name: this.state.transPath,
                        ext: ext
                    }
                    core.emit('gotFileContent', '', file, this.state.transLocation);
                    this.setState({
                        transLocation: this.state.location,
                        transPath: '',
                        path: ''
                    })
                }
            } else {
                console.log('Error: ', err)
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
            errorMessage: '',
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
            } else if (newPath[0] == "ERR") {
                this.setState({
                    pathError: true,
                    errorMessage: newPath[1]
                })
            }
        }
        
    }

    handleCreateClick = () => {
        if (!this.state.pathError) {
            if (this.state.path == "" || !this.state.path) {
                this.setState({
                    pathError: true,
                    errorMessage: 'Path cannot be empty'
                });
            } else {
                core.ipc.send("createFile", this.state.transLocation+ '/' + this.state.transPath);
            }
        }
    }

   

    render() {
        return (
            <Dialog open={this.props.open} onClose={this.props.onClose}>
                <DialogTitle> <span style={{color: '#ffffff'}}>{'Create file'} </span> </DialogTitle>
                <DialogContent>
                    {/* {
                        (this.state.activePart === "left")? 
                        <Typography style={{color: '#ffffff',}}> {this.props.location[this.state.activePart].path + '/' + this.state.path} </Typography>:
                        <Typography style={{color: '#ffffff',}}> {this.props.location[this.state.activePart].path + '/' + this.state.path} </Typography> 
                                
                    } */}
                    <Typography style={{color: '#ffffff',}}> {this.state.displayPath} </Typography>
                    <TextField 
                        error={this.state.pathError} 
                        label={(this.state.pathError)? this.state.errorMessage :"Enter path" }
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