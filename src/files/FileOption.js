// Node JS imports
import React from 'react';
import { Typography } from '@material-ui/core';

//JS Files imports
import core from '../system/core'

export default class FileOption extends React.Component {
    constructor(props) {
        super(props);
        let columnMode = localStorage.getItem('columnMode');
        let additionalColumns = localStorage.getItem("additionalColumns");
        this.state = {
            size: '',
            optionName: "",
            createTime: (this.props.file)?props.file.createTime:null,
            modifyTime: (this.props.file)?props.file.modifiedTime:null,
            openTime: (this.props.file)?props.file.openTime:null,
            type: (this.props.file)?props.file.type:null,
            columnMode: (columnMode)? columnMode: 'size',
            options: (additionalColumns)? additionalColumns.split("~*~"):['init', 'init', 'init'],
        }
    }

    componentDidMount() {
        
        if (this.props.type == "name") {
            let options = core.additionalOptionsList;
            let curOption = this.state.options[this.props.position];
            options.forEach((option) => {
                if (option.value == curOption) {
                    this.setState({optionName: option.label});
                }
            })
        } else if (this.props.type == "option") {
            let size = this.props.file.size;
            let convertedSize = size;
            console.log(size);
            let unit = 'B';
            if (size > 1024) {
                if (size/1024 >= 1024) {
                    if (size/(1024*1024) >= 1024) {
                        if (size/(1024*1024*1024) >= 1024) {
                            convertedSize = Math.round((size/(1024*1024*1024*1024))*100)/100;
                            unit = 'TB'
                        } else {
                            convertedSize = Math.round((size/(1024*1024*1024))*100)/100;

                            unit = 'GB'
                        }
                    } else {
                        convertedSize = Math.round((size/(1024*1024))*100)/100;
                        unit = 'MB'
                    }
                } else {
                    convertedSize = Math.round((size/(1024))*100)/100;
                    unit = 'KB'
                }
            }

            let options = {
                year: '2-digit',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            }

            let modifyTime = new Date(this.state.modifyTime).toLocaleString('ru-ru', options);
            let createTime = new Date(this.state.createTime).toLocaleString('ru-ru', options);
            let openTime = new Date(this.state.openTime).toLocaleString('ru-ru', options);

            this.setState({
                size: convertedSize + ' ' + unit,
                createTime: createTime,
                modifyTime: modifyTime,
                openTime: openTime,
            })
        }

        core.on('updateItems', this.updateItem);
    }

    componentWillReceiveProps(props) {
        this.setState({type: (props.file)?props.file.type:null})
    }
    
    componentWillUnmount() {
        core.off('updateItems', this.updateItem);
    }

    updateItem = () => {
        let columnMode = localStorage.getItem('columnMode');
        let additionalColumns = localStorage.getItem('additionalColumns')
        if (columnMode || additionalColumns) {
            this.setState({
                columnMode: columnMode,
                options: additionalColumns,
            });
        }

        if (this.props.type == "name") {
            let options = core.additionalOptionsList;
            let curOption = localStorage.getItem("options").split("~*~")[this.props.position];
            options.forEach((option) => {
                if (option.value == curOption) {
                    this.setState({optionName: option.label});
                }
            })
        }
    }
    render() {
        return (
            (this.props.type=="option")? (
                (!this.props.file.isDir)? (
                    (this.props.position == 'columnMode')? (
                        <span id={this.props.id} className={this.props.className}>{this.state[this.state.columnMode]} </span>
                    ): (
                        <span id={this.props.id} className={this.props.className}>{this.state[this.state.options[this.props.position]]} </span>
                    ) 
                ): (this.props.filePanelMode == "row" && this.state.options[this.props.position] == "size" )? (
                        <span id={this.props.id} className={this.props.className}> Folder </span>
                    ): (
                        (this.state.options[this.props.position] == "size" )?
                            null : (
                                <span id={this.props.id} className={this.props.className}>{this.state[this.state.options[this.props.position]]} </span>
                            )
                    )
            ): (
                <span id={this.props.id} className={this.props.className} style={{whiteSpace: 'nowrap'}}> {this.state.optionName} </span>
            )

        )
    }
}