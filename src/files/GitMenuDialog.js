// Node JS imports
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, RadioGroup, Radio, FormControl, FormControlLabel, FormLabel, Typography } from '@material-ui/core';
import { createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';

// JS Files imports
import core from '../system/core';
import FilePanelManager from './Manager';

export default class GitMenuDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cloneUrl: '',
        }
    }

    componentDidMount() {
        core.ipc.on("gitCloneRepoCallback", this.handleCloneCallback);
    }

    handleCloneCallback = (event, status, isErr) => {
        if (isErr) {
            console.log(status);
        } else {
            console.log(status);
            this.props.onClose();
        }
    }

    handleUrlChange = (event) => {
        this.setState({cloneUrl: event.target.value})
    }

    handleCloneClick = () => {
        let { cloneUrl } = this.state;
        let path = core.location[this.props.activePart].path;
        let splittedUrl = cloneUrl.replace(".git", "").split('/');
        let name = splittedUrl[splittedUrl.length - 1];
        core.ipc.send("gitCloneRepo", cloneUrl, path, name);
    }

    render() {
        let error = this.state.pathError;
        return (
            <Dialog open={this.props.open} onClose={this.props.onClose}>
                <DialogTitle> <span style={{color: '#ffffff'}}>{'Clone project form Git'} </span> </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth={true}
                        label="SSH or HTTPS..."
                        value={this.state.cloneUrl}
                        onChange={this.handleUrlChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button style={{color: '#ffffff',}} onClick={this.props.onClose}> Cancel </Button>
                    <Button onClick={this.handleCloneClick}> Clone </Button>
                </DialogActions>
            </Dialog>
            
        )
    }
}