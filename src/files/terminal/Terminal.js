import { Terminal } from 'xterm';
import * as attach from 'xterm/lib/addons/attach/attach';
import * as fit from 'xterm/lib/addons/fit/fit';
import * as fullscreen from 'xterm/lib/addons/fullscreen/fullscreen'
import React from 'react';
import axios from 'axios';
import os from 'os'

import core from '../../system/core';

require('xterm/lib/addons/fullscreen/fullscreen.css')

export default class DNTerminal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pid: null
        }
        this.termSocket = null;
        this.terminal;
    }

    componentDidMount() {
        Terminal.applyAddon(attach);
        Terminal.applyAddon(fit);
        Terminal.applyAddon(fullscreen);
        this.terminal = new Terminal({
            fontFamily: (os.type == "Linux")? "ubuntu mono":null
        });

        axios.post('/api/openTerminal', {}).then((response) => {
            this.setState({pid: response.data});
            this.terminal.open(document.getElementById("terminal" + this.props.terminalId));
            // terminal.fit()
            // terminal.toggleFullScreen();
            
            this.termSocket = new WebSocket("ws://localhost:3030/terminal/" + this.state.pid);
            this.termSocket.onopen = () => {
                this.terminal.attach(this.termSocket);
                this.terminal._initialized = true;
                console.log('WS has been opened');
            }
        })

        core.on('termEmit', this.emitCommand);
    }

    emitCommand = (event, path) => {
        this.terminal.focus();
        this.terminal.emit('data', 'bash ' + path);
        let e = new KeyboardEvent('keydown', {
            key: 'Enter',
        });
        // e.key = "Enter";
        document.dispatchEvent(e);
    
    }

    componentWillUnmount() {
        this.termSocket.close()
        core.off('termEmit', this.emitCommand);

    }

    render() {
        return (
            <div id={'terminal' + this.props.terminalId}>

            </div>
        )
    }
}