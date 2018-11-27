// Node JS imports
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    TextField, Checkbox, Typography, RadioGroup, Radio, FormControlLabel, 
    FormControl
} from '@material-ui/core';
import { createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';
import os from 'os';

// JS Files imports
import core from '../system/core';

const isWin32 = (os.type == 'Windows_NT');

export default class GoogleAccountDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            
        }
    }

    handleLogOut = () => {
        core.ipc.send("googleLogOut");
    }

    render() {
        const { googleCredentials, open, onClose } = this.props;

        return (
            <Dialog
                open={open}
                onClose={onClose}
            >
                <DialogTitle> <span style={{color: '#ffffff'}}> {(googleCredentials)?googleCredentials.displayName:null} </span> </DialogTitle>
                <DialogContent>
                    
                </DialogContent>
                <DialogActions>
                    {/* <Button onClick={this.handleOpenDrive}> Open Drive </Button> */}
                    <Button onClick={this.handleLogOut}> Log out </Button>
                    <Button style={{color: '#ffffff',}} onClick={onClose}> Cancel </Button>
                </DialogActions>
            </Dialog>
        )
    }
}