import React, {Component} from 'react';
import { Tabs, Tab, IconButton, Tooltip, Popper, Paper, Grow, MenuList, MenuItem, ClickAwayListener, Menu } from '@material-ui/core';
import { Close, MoreVert, CloudDownload } from '@material-ui/icons';
import FlexBand, { FlexBandItem } from 'flexband'


const tabHeight = 36;

export default class AppHeader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menuOpen: false,
            itemMenu: null
        }
    }

    handleCloseClick(tabName, tabPath, tabType) {
        if (this.props.onCloseClick) {
            this.props.onCloseClick(tabName, tabPath, tabType);
        }
    }

    handleClickMenu = (event) => {
        this.setState({menuOpen: !this.state.menuOpen, itemMenu: event.currentTarget});
    }

    render() {
        return (
            <FlexBand wrap="nowrap" style={{height: tabHeight}} >
                <FlexBandItem style={{ width: '90%'}}>
                    <Tabs 
                        scrollButtons={'off'} 
                        scrollable={true} 
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
                                    
                                >
                                    <MoreVert 
                                        style={{
                                            fill: '#ffffff',
                                            
                                        }} 
                                        onClick={this.handleClickMenu}
                                    />
                                </IconButton>
                            </Tooltip>
                                <Menu open={this.state.menuOpen} onClose={this.handleClickMenu} id={this.state.menuOpen?"props-menu":null} anchorEl={this.state.itemMenu}>                                    
                                    <MenuItem onClick={this.props.openOptions}> Preferences </MenuItem>
                                    <MenuItem> Key commands </MenuItem>   
                                </Menu>
                        </FlexBandItem>
                    </FlexBand>
                </FlexBandItem>
            </FlexBand>
        );
    }
}