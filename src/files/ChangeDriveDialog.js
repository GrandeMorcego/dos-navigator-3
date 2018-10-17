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
        let { drive } = this.state;
        let { activePart } = this.props;
        this.props.onClose();
        core.location[activePart].disk = drive;
        console.log('DRIVE ==>> ', core.location[activePart].drive);
        if (drive != 'googleDrive') {
            core.location[activePart].drive = 'files'
        } else {
            core.location[activePart].drive = drive
        }
        core.emit('driveChanged', activePart);
    }

    compareDrives = (drive1, drive2) => {
        console.log("compare ", drive1, drive2);
        if (drive1 === drive2) return 0;
        return -1;
    }
    

    render() {
        const {
            drives,
            onClose,
        } = this.props;

        const points = [];

        if (drives) {
            drives.forEach( drive => {
                const { mountpoints } = drive;
                if (mountpoints && mountpoints[0]) {
                        mountpoints.forEach( 
                            (point, id) => points.push({
                                point: point,
                                upperName: point.path.toLocaleUpperCase(),
                            })
                        );
                }
            });

            points.sort( ( point1, point2 ) => point1.upperName.localeCompare(point2.upperName) );
            console.log("----> points: ", points, ' - win32 -- ', os.type);
        }

        const mountPoints = points.map( ({ point, upperName }) => (
            <FormControlLabel
                key={ upperName }
                value={ point.path }
                control={ <Radio color="default"/> }
                label={ isWin32 ? point.path : point.label}
            />
        ));

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
                            
                            { mountPoints }
                            {/* <Typography> Cloud drives </Typography> */}
                            <FormControlLabel
                                key={ 'gdrive' }
                                value={ 'googleDrive' }
                                control={ <Radio color="default"/> }
                                label={ 'Google Drive' }
                            />
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