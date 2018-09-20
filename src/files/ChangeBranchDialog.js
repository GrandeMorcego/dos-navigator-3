// Node JS imports
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, RadioGroup, Radio, FormControl, FormControlLabel, FormLabel, Typography } from '@material-ui/core';
import { createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';

// JS Files imports
import core from '../system/core';
import FilePanelManager from './Manager';

export default class ChangeBranchDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentBranch: props.currentBranch,
        }
    }

    componentDidMount() {
        core.ipc.on('gitCheckoutBranch', this.handleCheckoutCallback);
    }

    componentWillReceiveProps = (props) => {
        if (props.currentBranch != this.state.currentBranch) {
            this.setState({currentBranch: props.currentBranch});
        }
        console.log(props.repo);
    }

    handleCheckoutCallback = (event, status, message) => {
        if (status != "ERR") {
            this.props.onClose();
        }
        console.log(message);
    }

    handleCheckoutClick = () => {
        core.ipc.send('gitCheckoutBranch', this.props.repo, this.state.currentBranch);
    }

    handleBranchChange = (event) => {
        this.setState({currentBranch: event.target.value});
        this.forceUpdate();
    }

    render() {
        const {
            branches,
            onClose,
            open,
            currentBranch
        } = this.props;

        return (
            <Dialog
                open={open}
                onClose={onClose}
            >
                <DialogTitle> <span style={{color: '#ffffff'}}>{'Change current branch'} </span> </DialogTitle>
                <DialogContent>
                    <FormControl>
                        <RadioGroup
                            value={this.state.currentBranch}
                            onChange={this.handleBranchChange}
                        >
                            {(branches && branches.all)?branches.all.map((branch, id) => {
                                return (
                                    <FormControlLabel
                                        key={ id }
                                        value={ branch }
                                        control={ <Radio color="default"/> }
                                        label={ branch }
                                    />
                                )
                            }):null}
                        </RadioGroup>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button style={{color: '#ffffff',}} onClick={this.props.onClose}> Cancel </Button>
                    <Button onClick={this.handleCheckoutClick} > Change </Button>
                </DialogActions>
            </Dialog>
        )
    }
}