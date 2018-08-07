// Node JS imports
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, Typography } from '@material-ui/core';
import { createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';

// JS Files imports
import core from '../system/core';

export default class RenMovDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            manager: null,
            file: {
                name: null,
            },
            location: props.location,
            newPath: props.location.path + '/',

        }
    }

    componentDidMount() {
        core.on('getPanelFile', (event, manager, file) => {
            this.setState({
                manager: manager,
                file: file
            });

        })
        core.ipc.on('renMovCallback', (event, status, location) => {
            if (status == "success") {
                
                if (this.props.open){
                    this.props.onClose();
                    this.setState({
                        newPath: this.props.location.path + '/'
                    });
                    core.emit("changeSelectedFile", this.state.file.index);
                }
            }
        })
    }

    componentWillReceiveProps() {
        if (this.props.location.path != this.state.location.path) {
            this.setState({
                location: this.props.location,
                newPath: this.props.location.path + '/'
            })
        }
    }

    handlePathChange = (event) => { 
        this.setState({newPath: event.target.value});
    }

    handleCreateClick = () => {
        core.ipc.send("renMov", this.props.location.path + '/' + this.state.file.name, this.state.newPath);
    }

    render() {
        return (
            <Dialog
                open={this.props.open}
                onClose={this.props.onClose}
            >
                <DialogTitle> <span style={{color: '#ffffff'}}>{'RenMov'} </span> </DialogTitle>
                <DialogContent>
                    {(this.state.file)?
                        <Typography style={{color: '#ffffff'}}>{'Current path: ' + this.props.location.path + '/' + this.state.file.name}</Typography>:
                        <Typography style={{color: '#ffffff'}}>{'This directory is empty'}</Typography>
                    }
                    <TextField 
                        label="Enter new path"
                        value={this.state.newPath} 
                        onChange={this.handlePathChange}
                        disabled={(this.state.file)? false:true}
                        fullWidth={true}
                    />
                </DialogContent>
                <DialogActions>
                    <Button style={{color: '#ffffff',}} onClick={this.props.onClose}> Cancel </Button>
                    {
                        (this.state.file)? <Button onClick={this.handleCreateClick} > Create </Button> : null

                    }
                </DialogActions>
            </Dialog>
            
        )
    }
}