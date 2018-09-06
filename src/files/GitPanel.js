// Node JS imports
import React from 'react';
import { Typography, TextField, IconButton } from '@material-ui/core';
import { Done, ArrowUpward, ArrowDownward } from '@material-ui/icons';

// JS Files imports
import core from '../system/core';
import FlexBand, { FlexBandItem } from 'flexband';
import GitMenuDialog from './GitMenuDialog';

export default class GitPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            gitRepo: {
                left: {},
                right: {}
            },
            partId: '',
            commitMessage: '',
            isFocused: false,
            openGitMenu: false,
        }
    }

    componentDidMount() {
        core.on('fileIsRepo', this.handleIsRepo);
        core.on("keyDown", this.handleKeyDown);
        core.ipc.on('getRepoStatusCallback', this.handleRepoStatus);
        core.ipc.on('gitPullRepoCallback', this.pullRepoCallback);
        core.ipc.on('gitCommitRepoCallback', this.commitRepoCallback);
        core.ipc.on('gitPushRepoCallback', this.pushRepoCallback);
    }

    componentWillUnmount() {
        // core.off('fileIsRepo', this.handleIsRepo);
        // core.on("keyDown", this.handleKeyDown);
        // core.ipc.removeListener('getRepoStatusCallback', this.handleRepoStatus);
        // core.ipc.removeListener('gitPullRepoCallback', this.pullRepoCallback);
        // core.ipc.removeListener('gitCommitRepoCallback', this.commitRepoCallback);
        // core.ipc.removeListener('gitPushRepoCallback', this.pushRepoCallback);
        core.off('fileIsRepo', this.handleIsRepo);
        core.off("keyDown", this.handleKeyDown);
        core.ipc.removeListener('getRepoStatusCallback', this.handleRepoStatus);
        core.ipc.removeListener('gitPullRepoCallback', this.pullRepoCallback);
        core.ipc.removeListener('gitCommitRepoCallback', this.commitRepoCallback);
        core.ipc.removeListener('gitPushRepoCallback', this.pushRepoCallback);
    }

    handleKeyDown = () => {
        const cmd = core.keyMapper.mapKeyEvent(event, 'gitPanel');

        if (cmd) {
            switch(cmd.command) {
                case "openGitMenu":
                    this.handleOpenGitMenu();
                    break;
                default:
                    console.log("There is no action assigned on this key combination")
            }
        }
    }

    pullRepoCallback = (event, status) => {
        let path = this.state.gitRepo[this.props.activePart].path;
        core.ipc.send('getRepoStatus', path);
    }

    commitRepoCallback = (event, status) => {
        let path = this.state.gitRepo[this.props.activePart].path;
        core.ipc.send('getRepoStatus', path);
    }

    pushRepoCallback = (event, status) => {
        let path = this.state.gitRepo[this.props.activePart].path;
        core.ipc.send('getRepoStatus', path);
    }

    handleOpenGitMenu = () => {
        this.setState({openGitMenu: !this.state.openGitMenu});
        core.dialogOpened = !core.dialogOpened;
    }

    handleIsRepo = (event, part, path, gitRepo) => {
        gitRepo.path = path;
        this.state.gitRepo[part] = gitRepo;
        this.setState({partId: part})
        if (gitRepo.isRepo) {
            core.ipc.send('getRepoStatus', path);
        }
        this.forceUpdate();
    }

    handleRepoStatus = (event, status) => {
        this.state.gitRepo[this.state.partId].status = status;
        this.forceUpdate();
    }

    handlePullClick = () => {
        let { gitRepo, partId } = this.state;
        core.ipc.send('gitPullRepo', gitRepo[partId]);
    }

    handleCommitClick = () => {
        let { gitRepo, partId, commitMessage } = this.state;
        core.ipc.send('gitCommitRepo', gitRepo[partId], commitMessage);
        this.setState({commitMessage: ''});
    }

    handlePushClick = () => {
        let { gitRepo, partId } = this.state;
        core.ipc.send('gitPushRepo', gitRepo[partId]);
    }

    handleCommitMessageChange = (event) => {
        let value = event.target.value;
        this.setState({commitMessage: value});
    }

    render() {
        let { gitRepo, commitMessage, openGitMenu } = this.state;
        let { activePart } = this.props;
        let currentRepo = gitRepo[activePart];

        return (
            <div style={{backgroundColor: '#37474F', height: '100%'}}>
                {
                    (currentRepo.isRepo && currentRepo.status)? (
                        <div>
                            <Typography> Current branch: {currentRepo.status.current} </Typography> 
                            {currentRepo.status.behind}
                            <IconButton style={{width: '16', height: '16'}}>
                                <ArrowDownward
                                    onClick={this.handlePullClick}
                                />
                            </IconButton>
                            {currentRepo.status.ahead}
                            <IconButton 
                                style={{width: '16', height: '16'}}
                            >
                                <ArrowUpward
                                    onClick={this.handlePushClick}
                                />
                            </IconButton>
                            <div>
                                <div style={{display: 'inline-block', width: '80%'}}>
                                    <TextField 
                                        label="Commit message..." 
                                        value={commitMessage} 
                                        fullWidth={true} 
                                        onChange={this.handleCommitMessageChange} 
                                        onFocus={() => {core.isGitFocused = true}}
                                        onBlur={() => {core.isGitFocused = false}}
                                    />
                                </div>
                                <div style={{display: 'inline-block'}}>
                                    <IconButton style={{width: '16', height: '16'}}>
                                        <Done 
                                            onClick={this.handleCommitClick}
                                        />
                                    </IconButton>
                                </div>
                            </div>
                            {(currentRepo.status.not_added && currentRepo.status.not_added[0])? (
                                currentRepo.status.not_added.map((file, id) => {
                                    return (
                                        <FlexBand 
                                            key={id}
                                            wrap="nowrap" 
                                            direction="row" 
                                            style={{justifyContent: 'space-between', width: '100%'}}
                                        >
                                            <Typography style={{paddingLeft: 4, color: 'green'}} > {file} </Typography>
                                            <Typography style={{paddingRight: 4}}> U </Typography>
                                        </FlexBand>
                                    )
                                })
                            ) : null}
                            {(currentRepo.status.modified && currentRepo.status.modified[0])? (
                                <Typography> Modified </Typography>,
                                currentRepo.status.modified.map((file, id) => {
                                    return (
                                        <FlexBand 
                                            key={id}
                                            wrap="nowrap" 
                                            direction="row" 
                                            style={{justifyContent: 'space-between', width: '100%'}}
                                        >
                                            <Typography style={{paddingLeft: 4, color: 'yellow'}} > {file} </Typography>
                                            <Typography style={{paddingRight: 4}}> M </Typography>
                                        </FlexBand>
                                    )
                                })
                            ) : null 
                            }
                        </div>
                    ): 'File isnt a repo'
                }
                <GitMenuDialog 
                    open={openGitMenu}
                    onClose={this.handleOpenGitMenu}
                    activePart={activePart}
                />
            </div>
        );
    }
}