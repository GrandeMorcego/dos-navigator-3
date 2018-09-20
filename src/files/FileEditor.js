// Node JS imports
import React from 'react';
import MonacoEditor from 'react-monaco-editor';

//JS Files imports
import core from '../system/core';
import Manager from './Manager';

export default class FileEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: props.data, 
            editorType: 'text'
        }
        this.manager = new Manager();
    }

    componentDidMount() {
        core.on('keyDown', this.handleKeyDown);
        core.on('getData', this.getData);
        core.ipc.on('saveFileCallback', this.saveFileCallback);
        core.saveStatus[this.props.name] = true;
        // if (this.props.fileExt == '.JS') {
        //     this.setState({editorType: 'javascript'})
        // } else if (this.props.fileExt == '.PY') {
        //     this.setState({editorType: 'python'});
        // } else if (this.props.fileExt == ".JSON") {
        //     this.setState({editorType: 'json'});
        // } else if (this.props.) {

        // } else {
        //     this.setState({editorType: 'text'});
        // }

        switch (this.props.fileExt) {
            case ".JS":
                this.setState({editorType: 'javascript'});
                break;
            case ".PY":
                this.setState({editorType: 'python'});
                break;
            case ".JSON":
                this.setState({editorType: 'json'});
                break;
            case ".CPP":
                this.setState({editorType: 'cpp'});
                break;
            default:
                this.setState({editorType: 'text'})
        }
    }

    componentWillUnmount() {
        core.off('keyDown', this.handleKeyDown);
        core.off('getData', this.getData);
        core.ipc.removeListener('saveFileCallback', this.saveFileCallback);
    }

    saveFileCallback = (event, status) => {
        if (status == 'SUCCESS') {
            core.saveStatus[this.props.name] = true;
        }
    }

    getData = (event, fileName) => {
        if (fileName == this.props.name) {
            core.emit('getDataCallback', this.state.data);
        }
    }

    handleChange = (value) => {
        core.saveStatus[this.props.name] = false;
        this.props.onChange(this.props.name, value);
        this.setState({data: value})
    }

    handleKeyDown = (eventType, event) => {
        const cmd = core.keyMapper.mapKeyEvent(event, 'fileEdit');
        if (cmd) {
            switch (cmd.command) {
                case 'saveFile':
                    this.manager.saveFile(this.props.path + '/' + this.props.name, this.state.data);
                    break;
                default: 
                    console.log("There is no command assigned on this key combination");
            }
        }
    }

    render() {
        return (
            <MonacoEditor
                width="100%"
                height='100%'
                language={this.state.editorType}
                theme="vs-dark"
                value={this.state.data}
                onChange={this.handleChange}
            />
        )
    }
}