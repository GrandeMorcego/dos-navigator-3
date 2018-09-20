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
            repoName: ''
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
    
    handleNameChange = (event) => {
        this.setState({repoName: event.target.value});
    }

    handleUrlChange = (event) => {
        this.setState({cloneUrl: event.target.value})
    }

    handleCloneClick = () => {
        let { cloneUrl, repoName } = this.state;
        let path = core.location[this.props.activePart].path;

        core.ipc.send("gitCloneRepo", cloneUrl, path, repoName);
    }

    handleUrlPaste = (event, something) => {
        let pasting = event.clipboardData.getData("Text");
        let splittedUrl = pasting.replace(".git", "").split('/');
        let name = splittedUrl[splittedUrl.length - 1];
        this.setState({repoName: name});
    }

    render() {
        let error = this.state.pathError;
        return (
            <Dialog open={this.props.open} onClose={this.props.onClose}>
                <DialogTitle> <span style={{color: '#ffffff'}}>{'Clone project form Git'} </span> </DialogTitle>
                <DialogContent>
                <TextField
                        fullWidth={true}
                        label="Name"
                        value={this.state.repoName}
                        onChange={this.handleNameChange}
                    />
                    <TextField
                        fullWidth={true}
                        label="SSH or HTTPS..."
                        value={this.state.cloneUrl}
                        onPaste={this.handleUrlPaste}
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