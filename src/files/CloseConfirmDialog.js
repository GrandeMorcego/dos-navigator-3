//Node JS imports
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, Typography, FormControlLabel } from '@material-ui/core';

//JS Files imports
import core from '../system/core';
import Manager from './Manager';

export default class CloseConfirmDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: null
        }
        this.manager = new Manager()
    }

    componentDidMount() {
        core.ipc.on('saveFileCallback', this.electronCallback);
        core.on('getDataCallback', this.getDataCallback);
    }

    componentWillUnmount() {
        core.ipc.removeListener('saveFileCallback', this.electronCallback);
        core.off('getDataCallback', this.getDataCallback);
    }

    getDataCallback = (event, data) => {
        this.setState({data: data});
    }

    electronCallback = (event, status) => {
        if (status == "SUCCESS") {
            core.emit('fileSaveConfirmed', this.props.file.name);
        }
    }

    handleNoSaveClick = () => {
        core.emit('fileSaveAction', 'actioned');
    }

    handleCancelClick = () => {
        core.emit('fileSaveAction', 'cancel')
    }

    handleSaveClick = () => {
        this.manager.saveFile(this.props.file.path + '/' + this.props.file.name, this.state.data);
        core.emit('fileSaveAction', 'actioned');
    }
    render() {
        return(
            <Dialog
                open={this.props.open}
            >
                <DialogTitle> <span style={{color: '#ffffff'}}>{'Confirm Action'} </span> </DialogTitle>
                <DialogContent>
                    <Typography>{'This file is unsaved. Do you want to save it (overwise all changes will be lost)? '}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleCancelClick} > Cancel </Button>
                    <Button style={{color: '#ffffff',}} onClick={this.handleNoSaveClick}> Don't Save </Button>
                    <Button onClick={this.handleSaveClick} > Save </Button>
                </DialogActions>
            </Dialog>
        )
    }
}