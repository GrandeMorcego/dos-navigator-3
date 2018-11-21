//Node JS imports
import React, {Component} from 'react';
import ln3 from "ln3";
import { Paper, IconButton, Icon, Button, Hidden, InputAdornment, Tooltip } from '@material-ui/core';
import ArrowBack from '@material-ui/icons/ArrowBack'
import PropTypes from "prop-types";
import ipcRenderer from 'electron';
import os from 'os'; //temporary
import FlexBand, { FlexBandItem } from 'flexband';
import Search from '@material-ui/icons/Search';
import Close from '@material-ui/icons/Close';
import FilterList from '@material-ui/icons/FilterList';
import { TextField } from '@material-ui/core';

//JS files imports
import core from '../system/core';
import DriveImage from "../../icons/drive.svg";

class SearchPane extends Component {
    constructor (props, ...other) {
        super(props, ...other);
        this.state = {
            open: props.open,
            text: props.text,
            filter: props.filter,

        }

    }

    componentDidMount() {
        this.props.manager.on("forceSearchOpen", this.handleForceOpen).
            on("setFilter", this.handleSetFilter);
    }

    componentWillUnmount() {
        this.props.manager.off("forceSearchOpen", this.handleForceOpen).
            off("setFilter", this.handleSetFilter);
    }

    setOpen(onOff, addState) {
        this.setState( { open: onOff, ...addState } );
        this.props.manager.setSearchOpen(onOff);
    }

    handleForceOpen = (event, onOff) => {
        this.setOpen(onOff);
    }

    handleSetFilter = (event, value) => {
        this.setState({ filter: value ? true : false });
    }

    handleKeyDown = event => {
        if (event.key === "Tab") {
            event.preventDefault();
            this.setOpen(false);
        }
    }

    handleCloseClick = event => {
        this.inputElement = null;
        this.setOpen(false, { text: ""  });
        this.notifyChange("");
    }

    handleFilterClick = event => {
        const manager = this.props.manager;
        const filter = manager.filter;
        manager.setFilter(this.state.filter ? null : filter );
        this.notifyChange(this.state.text);
        if (this.inputElement) {
            this.inputElement.focus();
        }
    }

    handleTextChange = event => { 
        const value = event.target.value;
        this.setState({ text: value });
        this.notifyChange(value);
    }

    handleOpen = () => {
        this.setOpen(true);
    }

    notifyChange(text) {
        if (this.props.onFilterChange) {
            this.props.onFilterChange(text, this.state.filter);
        }
    }

    render() {
        let contents, xWidth;

        if (this.state.open) {
            xWidth = 200;
            contents = (
                <TextField 
                    fullWidth 
                    inputRef={ e => {
                        if (e && e.focus) {
                            e.focus();
                        }
                        this.inputElement = e;
                    } }
                    onChange={ this.handleTextChange }
                    onKeyDown={ this.handleKeyDown }
                    onFocus={ () => this.props.manager.emit("searchOpen", true)  }
                    onBlur={ () => { 
                        if (!this.meClicked && !this.state.text) {
                            this.setOpen(false);
                        }
                    }}
                    InputProps={{
                        startAdornment: 
                            <InputAdornment position="start">
                                <Search style={{ fontSize: 20 }} />
                            </InputAdornment>,
                        endAdornment: 
                            <InputAdornment position="end">
                                <div className={ this.state.filter ? "icon-pressed" : ""  } >
                                <IconButton  
                                    className="helper-button-s"
                                    aria-label="Filter"
                                    onClick={ this.handleFilterClick }
                                >
                                    <FilterList style={{ fontSize: 16 }} />
                                </IconButton>
                                </div>
                                <IconButton  
                                    className="helper-button-s"
                                    aria-label="Close"
                                    onClick={ this.handleCloseClick }
                                >
                                    <Close style={{ fontSize: 16 }} />
                                </IconButton>
                            </InputAdornment>,
                    }}
                    onMouseDown={ e => { 
                        this.meClicked = true; 
                        let self = this;
                        setTimeout(() => {
                            self.meClicked = false;
                        }, 500);
                    } }
                />
            );
        } else {
            xWidth = 36;
            contents = (
                <IconButton  
                    aria-label="Search / Filter"
                    onClick={ this.handleOpen }
                    className="helper-button"
                >
                    <Search style={{ fontSize: 24, color: "black" }} />
                </IconButton>
            );
        }   
        return (
            <div className="wide-animate" style={{ width: xWidth, }}>
                { contents }
            </div>
        );

    }
}


export default class PathPanel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            disabled: false
        }
    }

    componentWillReceiveProps() {
        if (this.props.location.path == '/') {
            this.setState({disabled: true})
        }
    }

    handleClick = () => {
        this.props.manager.commandOpenParentDir();
        let changeFocusTimeout = setTimeout(() => {
            this.props.onFocusRequest();
        }, 100);
    }

    handleDriveClick = () => {
        core.emit('openDrives', this.props.panelId);
        let changeFocusTimeout = setTimeout(() => {
            this.props.onFocusRequest();
        }, 100);
    }

    render() {
        const iconSize = {height: 32, width: 32}
        return (
            <div className="info-padding">
                <Paper >   
                    <div className={ "panel-header" + ( this.props.isFocused ? " focused" : "" ) }>
                        {/* <div style={(this.props.location.path != '/' && os.type != "Windows_NT")?{position: 'relative', bottom: 10}:null} className="overflow-hidden" > */}
                            <FlexBand wrap="nowrap" style={{alignItems: 'center'}}>
                                <IconButton style={iconSize} onClick={this.handleClick}>
                                    <ArrowBack style={{fill: '#000000'}} />
                                </IconButton>
                                <FlexBandItem grow="1" style={{ overflow: "hidden" }} >
                                    { this.props.location.path }
                                </FlexBandItem>
                                <SearchPane 
                                    onFilterChange={ this.props.onFilterChange } 
                                    manager={ this.props.manager }
                                />
                                <Tooltip title="Change drive">
                                    <IconButton style={iconSize} onClick={this.handleDriveClick}>
                                        <img src={DriveImage} style={{width: 22, height: 'auto'}} />
                                    </IconButton>
                                </Tooltip>
                            </FlexBand>
                        {/* </div> */}
                            <div style={{ position: "relative",  }} >
                                <div className="find-pane" style={{ position: "absolute", bottom: 0, right: 0, background: "red", minHeight: "24px"}}>
                                   
                                </div>
                            </div>
                    </div>
                </Paper>
            </div>

        );
    }   
}

