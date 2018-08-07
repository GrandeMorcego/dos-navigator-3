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

export default class ChangeDriveDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            drive: core.location[this.props.activePart].disk,
            drives: null
        }
    }

    componentDidMount() {
    }

    componentWillUnmount() {

    }

    handleDriveChange = (event) => {
        this.setState({drive: event.target.value});
    }

    handleChangeClick = () => {
        this.props.onClose();
        core.location[this.props.activePart].disk = this.state.drive;
        core.emit('driveChanged', this.props.activePart);
    }
    

    render() {
        return (
            <Dialog
                open={this.props.open}
                onClose={this.props.onClose}
            >
                <DialogTitle> <span style={{color: '#ffffff'}}>{'Change current drive'} </span> </DialogTitle>
                <DialogContent>
                    <FormControl>
                        <RadioGroup
                            value={this.state.drive}
                            onChange={this.handleDriveChange}
                        >
                            {(this.props.drives)?
                                this.props.drives.map((drive) => {
                                    if (drive.mountpoints && drive.mountpoints[0]) {
                                        return (
                                            drive.mountpoints.map((point, id) => {
                                                return (
                                                    <FormControlLabel
                                                        key={id}
                                                        value={point.path}
                                                        control={<Radio color="default"/>}
                                                        label={(os.type == 'Windows_NT')? point.path:point.label}
                                                    />
                                                )
                                            })
                                        )  
                                    }
                                }): null
                            }
                        </RadioGroup>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button style={{color: '#ffffff',}} onClick={this.props.onClose}> Cancel </Button>
                    <Button onClick={this.handleChangeClick} > Change </Button>
                </DialogActions>
            </Dialog>
        )
    }
}