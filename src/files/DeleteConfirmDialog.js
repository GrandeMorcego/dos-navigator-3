// Node JS imports
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, Typography, FormControlLabel } from '@material-ui/core';
import { createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';

// JS Files imports
import core from '../system/core';

export default class DeleteConfirmDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            files: [],
            perm: false,
        }
    }

    componentDidMount() {
        core.on('deletingFiles', this.handleDeleteItems);
        core.ipc.on('deleteFilesCallback', (event, status, file) => {
            if (status == 'SUCCESS') {
                if (this.props.open){
                    this.props.onClose();
                    this.setState({
                        files: [],
                        perm: false,
                    });
                    // core.emit("changeSelectedFile", 0);
                }
            } else {
                console.log(status, file);
            }
        })
    }

    handleDeleteItems = (event, files, panelId, rClickAction) => {
        this.setState({files: files});
        if (rClickAction && this.props.panelId == panelId) {
            this.props.onClose();
        }
    }

    handleDeleteClick = () => {
        if (this.state.perm) {
            core.ipc.send("deleteFilesPerm", this.state.files, core.location[this.props.panelName].path)
        } else {
            core.ipc.send("deleteFiles", this.state.files, core.location[this.props.panelName].path)
        }
    }

    handleCheck = () => {
        this.setState({perm: !this.state.perm})
    }

    render() {
        return (
            <Dialog
                open={this.props.open}
                onClose={this.props.onClose}
            >
                <DialogTitle> <span style={{color: '#ffffff'}}>{'Confirm Action'} </span> </DialogTitle>
                <DialogContent>
                    <Typography>{'Are you sure you want delete this files:'}</Typography>
                    {
                        this.state.files.map((file, id) => {
                            return (
                                <Typography key={file}>{file}</Typography>
                            )
                        })
                    }
                    <FormControlLabel
                        
                        control={
                            <Checkbox 
                                checked={this.state.perm} 
                                onChange={this.handleCheck}
                            />
                        }
                        label="Delete permanently"
                    />
                </DialogContent>
                <DialogActions>
                    <Button style={{color: '#ffffff',}} onClick={this.props.onClose}> Cancel </Button>
                    <Button onClick={this.handleDeleteClick} > Delete </Button>
                </DialogActions>
            </Dialog>
        )
    }
}