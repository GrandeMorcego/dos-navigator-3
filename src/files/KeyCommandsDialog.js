// Node JS imports
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, RadioGroup, Radio, FormControl, FormControlLabel, FormLabel, Typography } from '@material-ui/core';
import { createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';

// JS Files imports
import core from '../system/core';
import FilePanelManager from './Manager';

export default class KeyCommandsDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
    
        }
    }

    componentDidMount() {
        
    }

    render() {
        let typographyStyle = {
            color: '#ffffff'
        }
        let error = this.state.pathError;
        return (
            <Dialog open={this.props.open} onClose={this.props.onClose}>
                <DialogTitle> <span style={{color: '#ffffff'}}>{'Key Commands (temporary help)'} </span> </DialogTitle>
                <DialogContent>
                    <Typography> F - toggle search input </Typography>
                    <Typography> F4 - edit file (with Monaco Editor) </Typography>
                    <Typography> F5 - copy file </Typography>
                    <Typography> F6 - rename and move file </Typography>
                    <Typography> F7 - create directory </Typography>
                    <Typography> F8 - delete file(s) </Typography>
                    <Typography> Shift+F4 - create file </Typography>
                    <Typography> Shift+ArrowUp/ArrowDown - select file </Typography>
                    <Typography> Ctrl+p - open properties </Typography>
                    <Typography> Ctrl+s - save file (in editor) </Typography>
                    <Typography> Ctrl+= - select files by type </Typography>
                    <Typography> Ctrl+- - deselect files by type </Typography>
                    <Typography> Ctrl+Shift+= - select files by color </Typography>
                    <Typography> Ctrl+Shift+- - deselect files by color </Typography>
                    <Typography> Ctrl+1 - swith file panel view </Typography>
                    <Typography> Alt+ArrowUp - open parent dir </Typography>
                </DialogContent>
                <DialogActions>
                    <Button style={{color: '#ffffff',}} onClick={this.props.onClose}> Close </Button>
                </DialogActions>
            </Dialog>
        )
    }
}