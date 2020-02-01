// Node JS imports
import React, {Component} from 'react';
import { Tabs, Tab, IconButton, Tooltip, Popper, Paper, Grow, MenuList, MenuItem, ClickAwayListener, Menu } from '@material-ui/core';
import { Close, MoreVert, CloudDownload } from '@material-ui/icons';
import FlexBand, { FlexBandItem } from 'flexband'

// JS Files imports
import core from '../system/core';


const tabHeight = 36;

export default class AppHeader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menuOpen: false,
            itemMenu: null
        }
    }

    componentDidMount() {
        core.on('updateHeader', () => this.forceUpdate());
    }

    componentWillUnmount() {
        core.off('updateHeader', () => this.forceUpdate());
    }

    handleCloseClick(tabName, tabPath, tabType) {
        if (this.props.onCloseClick) {
            this.props.onCloseClick(tabName, tabPath, tabType);
        }
    }

    handleClickMenu = (event) => {
        this.setState({menuOpen: !this.state.menuOpen, itemMenu: event.currentTarget});
    }

    propHandler(prop, event) {
        this.setState({ menuOpen: false });
        const handler = this.props[prop];
        if (handler) {
            handler(event);
        }
    }

    handleOpenOptions = event => this.propHandler("openOptions", event);

    handleOpenKeyCommands = event => this.propHandler("openKeyCommands", event);

    handleGoogleLogIn = event => this.propHandler("googleLogIn", event);

    handleOpenGoogleAccountDialog = event => this.propHandler("openGoogleAccountDialog", event);

    
    render() {
        // let googleCredentials = JSON.parse(localStorage.getItem("googleCredentials"));
        const { googleCredentials } = this.props;
        return (
            <FlexBand wrap="nowrap" style={{height: tabHeight}} >
                <FlexBandItem style={{ width: '90%'}}>
                    <Tabs 
                        scrollButtons={'auto'} 
                        value={this.props.tabValue} 
                        onChange={this.props.onChange} 
                    >
                        {this.props.tabs.map((tab, index) => {
                            return [
                                <Tab key={index} label={tab.name} value={tab.name} style={{height: tabHeight}} />,
                                
                                (tab.name != 'Files')?<Close onClick={(() => (this.handleCloseClick(tab.name, tab.path, tab.type)))} style={{position: 'relative', top: 6, right: 30}}/>:null
                            ]
                        })}
                    </Tabs>
                    
                </FlexBandItem>
                <FlexBandItem style={{
                    backgroundColor: '#777777',
                    width: '10%',
                }}>
                    <FlexBand wrap="nowrap" className="justify-content-end">
                        <FlexBandItem>
                            {/* <Tooltip title="Update avaible">
                                <IconButton
                                    style={{
                                        width: 36,
                                        height: 36,
                                    }}
                                >
                                    <CloudDownload 
                                        style={{
                                            fill: '#ffffff',
                                            
                                        }} 
                                    />
                                </IconButton>
                            </Tooltip> */}
                        </FlexBandItem>
                        <FlexBandItem>
                            <Tooltip title="Properties">
                                <IconButton
                                    style={{
                                        width: 36,
                                        height: 36,
                                    }}
                                    aria-owns="props-menu"
                                    aria-haspopup="true"
                                    onClick={this.handleClickMenu}
                                >
                                    <MoreVert 
                                        style={{
                                            fill: '#ffffff',
                                            
                                        }} 
                                    />
                                </IconButton>
                            </Tooltip>
                            <Menu open={this.state.menuOpen} onClose={this.handleClickMenu} id={this.state.menuOpen?"props-menu":null} anchorEl={this.state.itemMenu}>                                    
                                <MenuItem onClick={ this.handleOpenOptions }> Preferences </MenuItem>
                                <MenuItem onClick={ this.handleOpenKeyCommands }> Key commands </MenuItem> 
                                {(googleCredentials && googleCredentials.displayName)?
                                    <MenuItem onClick={ this.handleOpenGoogleAccountDialog }> {googleCredentials.displayName} </MenuItem>:
                                    <MenuItem onClick={  this.handleGoogleLogIn }> Log in to Google </MenuItem>}
                            </Menu>
                        </FlexBandItem>
                    </FlexBand>
                </FlexBandItem>
            </FlexBand>
        );
    }
}