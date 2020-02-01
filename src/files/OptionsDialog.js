// Node JS imports
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, Typography, Select, MenuItem, FormControl, InputLabel, Tab, Tabs } from '@material-ui/core';
import { createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';
import os from 'os';

// JS Files imports
import core from '../system/core';

const tabHeight = 36

export default class OptionsDialog extends React.Component {
    constructor(props) {
        super(props);
        let path =  (os.type == "Darwin" || os.type == "Linux")? '/':'C:/'
        let additionalColumns = localStorage.getItem("additionalColumns");
        let columnMode = localStorage.getItem('columnMode');
        let defaultPath = localStorage.getItem('defaultPath');
        this.state = {
            additionalColumns: (additionalColumns)?additionalColumns.split("~*~"): ['init', 'init', 'init', 'init'],
            columnMode: (columnMode)?columnMode:'init',
            tabValue: 'defaultPath',
            defaultPath: (defaultPath)? JSON.parse(defaultPath): {
                left: {
                    drive: 'files',
                    disk: path,
                    path: os.homedir()
                },
                right: {
                    drive: 'files',
                    disk: path,
                    path: os.homedir()
                }
            },
            errorMessage: {
                left: '',
                right: ''
            },
            error: {
                left: false,
                right: false
            }
        }
    }

    componentDidMount() {
    
    }   

    handleChangeColumnMode = (event) => {
        this.state.columnMode = event.target.value;
        this.forceUpdate();
    }

    handleMultipleChange = (event, index) => {
        this.state.additionalColumns[index] = event.target.value;
        this.forceUpdate();
    }

    handleSaveButton = () => {
        if (!this.state.error.left && !this.state.error.right) {
            localStorage.setItem("defaultPath", JSON.stringify(this.state.defaultPath));
            localStorage.setItem('columnMode', this.state.columnMode)
            localStorage.setItem("additionalColumns", this.state.additionalColumns.join("~*~"));
            this.props.onClose();
            core.emit("updateItems");
        }
    }

    handleTabChange = (event, value) => {
        this.setState({tabValue: value});
    }

    handlePathChange = (event, panelId) => {
        this.state.errorMessage[panelId] = '';
        this.state.error[panelId] = false;
        if (event.target.value == '' || event.target.value == ' ') {
            this.state.error[panelId] = true;
            this.state.errorMessage[panelId] = 'Default path cannot be empty';
        } else if (os.type == 'Windows_NT') {
            let disk = event.target.value.charAt(0) + '://';
            this.state.defaultPath[panelId].disk = disk;
        } else if (os.type == 'Darwin' && event.target.value.split('/')[1] == "Volumes") {
            this.state.errorMessage[panelId] = 'You cannot set default path into the temporary directory';
            this.state.error[panelId] = true;
        }
        let defaultPath = this.state.defaultPath;
        defaultPath[panelId].path = event.target.value;
        this.setState({defaultPath: defaultPath})
        this.forceUpdate()
    }

    renderOptions() {
        return [
            <MenuItem key={'init'} value={'init'}>{'Choose an option'}</MenuItem>,
            core.additionalOptionsList.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))
        ]
    }
    render() {
        const selectStyle = {
            marginTop: 4
        }

        return (
            <Dialog
                open={this.props.open}
                onClose={this.props.onClose}
            >
                <DialogTitle> <span style={{color: '#ffffff'}}>{'Properties'} </span> </DialogTitle>
                <DialogContent>
                    <div style={{height: tabHeight}}>
                    <Tabs 
                        scrollButtons={'auto'} 
                        value={this.state.tabValue} 
                        onChange={this.handleTabChange} 
                    >
                        <Tab
                            value={'defaultPath'}
                            label={'Default Path'}
                        />
                        <Tab
                            value={'additionalCols'}
                            label={'Additional Columns'}
                        />
                    </Tabs>
                    </div>
                    <div style={{paddingTop: 14}}>
                    
                        {
                            this.state.tabValue == 'additionalCols' &&
                            <div>
                                <FormControl fullWidth={true} style={selectStyle}>
                                    <InputLabel>Column Mode</InputLabel>
                                    <Select
                                        fullWidth={true}
                                        value={this.state.columnMode}
                                        onChange={this.handleChangeColumnMode}
                                    >
                                        {this.renderOptions()}
                                    </Select>
                                </FormControl>

                                {this.state.additionalColumns.map((option, index) => {
                                    return (
                                        <FormControl key={index} fullWidth={true} style={selectStyle}>
                                            <InputLabel>Additional Option</InputLabel>
                                            <Select
                                                id={"select-"+index}
                                                fullWidth={true}
                                                value={this.state.additionalColumns[index]}
                                                onChange={(event) => (this.handleMultipleChange(event, index))}
                                            >
                                                {this.renderOptions()}
                                            </Select>
                                        </FormControl>
                                    )

                                })}
                            </div>
                        }
                        {
                            this.state.tabValue == "defaultPath" &&
                            <div>
                                
                                <TextField  
                                    label={(this.state.errorMessage.left != '' && this.state.errorMessage.left != null)?this.state.errorMessage.left : 'Left Panel'}
                                    error={this.state.error.left}
                                    fullWidth={true} 
                                    onChange={(event) => (this.handlePathChange(event, 'left'))}                                
                                    value={this.state.defaultPath.left.path} 
                                />
                            
                                <TextField  
                                    label={(this.state.errorMessage.right != '' && this.state.errorMessage.right != null)?this.state.errorMessage.right: 'Right Panel'}
                                    error={this.state.error.right}
                                    fullWidth={true} 
                                    onChange={(event) => (this.handlePathChange(event, 'right'))}                                
                                    value={this.state.defaultPath.right.path} 
                                />
                                
                            </div>
                        }
                    
                    </div>
                    
                </DialogContent>
                <DialogActions>
                    <Button style={{color: '#ffffff',}} onClick={this.props.onClose}> Cancel </Button>
                    <Button onClick={this.handleSaveButton}> Save </Button>
                </DialogActions>
            </Dialog>
        )
    }
}