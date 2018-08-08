// Node JS imports
import React, {Component} from 'react';
import ln3 from "ln3";
import FlexBand, { FlexBandItem } from "flexband";
import { Menu, MenuItem } from '@material-ui/core';
import { CheckBoxOutlineBlank, CheckBox, } from '@material-ui/icons';
import PropTypes from "prop-types";
import { ReflexElement, } from "react-reflex";

// Local JS Files imports
import core from '../system/core';
import IconManager from './Icons';
import FileOption from './FileOption';
import setFileColor from './Color';



const maxColumnWidth = 320;

const sNormal = 0;
const sSelected = 1;
const sFocused = 2;
const sCurrent = 4;




class SimpleFileLine extends Component {
    static propTypes = {
        /** called when item is cliced */
        onClick: PropTypes.func.isRequired,

        /**  File associated  */
        file: PropTypes.object.isRequired,

        /** True is selection checkbox should be shown */
        hasCheckbox: PropTypes.bool,

        /** True if the parent view is focused */
        isFocused: PropTypes.bool.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            selected: false,
            count: 0,
            size: 0,
            sizeType: 'b',
            newName: '',
            rightClickMenuOpen: false,
            menuElement: null
        }
    }

    componentDidMount() {
        let file = this.props.file;
        let fileColor = setFileColor(file.ext, file.isDir);
        this.props.file.color = fileColor;
        this.forceUpdate();
    }

    componentWillUnmount() {
        this.props.file.e = null;
    }

    updateItem = (event) => {
        this.forceUpdate();
    }

    handleClickMenu = (event) => {
        this.setState({rightClickMenuOpen: !this.state.rightClickMenuOpen, menuElement: event.currentTarget});
        this.props.onClick();
    }

    handleClick = (event) => {
        if (event.type == "contextmenu") {
            this.handleClickMenu(event);
        }
    }

    handleSelection = (event, value) => {
        const file = this.props.file;
        file.manager.selectFile(file, value);
        this.forceUpdate();
    }

    renderExtra() {

        const p = this.props;
        const s = this.state;
        const file = p.file;
        return (
            (this.props.filePanelMode == 'column')?
            <FileOption 
                type="option"
                className="file-size" 
                position="columnMode" 
                filePanelMode={this.props.filePanelMode}
                file={file} 
            />:null
        )
        
    }

    render() {
        let classAdd = "";

        const p = this.props;
        const s = this.state;
        const file = p.file;
        const typeAdd = (file.type) ? " type-" + file.type : "";
        // let initClass = (core.filePanelMode != "row")?"f-l-line":'f-l-line-full'
        // let divInit = (core.filePanelMode != "row")?"f-l-part":"f-l-part-full";
        let initClass = 'f-l-line'
        let divInit = 'f-l-part'
        if (file.isCurrent && p.isFocused) {
            classAdd += " fl-focused ";
        }
        
        const checkVisible = p.hasCheckbox ? "-visible" : "";

        return (
            
            <FlexBandItem 
                className={  (this.props.filePanelMode != 'row')?"f-l":"f-l-full" }  
                onClick={p.onClick}
                onContextMenu={this.handleClickMenu}
                id={"f" + file.manager.panelId + '.' + file.index}  
                aria-owns={this.state.rightClickMenuOpen? 'rclick-menu':null} aria-haspopup={'true'}
            > 
                <FlexBand style={{ height: "100%", flexWrap: 'nowrap'}} >
                    <FlexBandItem 
                        className={"f-l-check"+checkVisible} 
                        onClick={ () => { file.manager.selectFile(file, !file.selected);  } }
                    >
                        { ( p.hasCheckbox && file.selected) ? (
                            <CheckBox style={{fill: '#000000'}}/>
                        ) : (
                            <CheckBoxOutlineBlank style={{fill: '#000000'}} />
                        ) }
                    </FlexBandItem>
                    <span>
                    <span className="before"></span>
                    <IconManager fileExtention={file.ext} isDir={file.isDir} className="icon-center"/>
                    </span>
                    <FlexBandItem className={ initClass + classAdd + this.props.className} grow="1" >
                        <div className={ divInit + typeAdd + classAdd } style={{color: file.color}}>
                            {/* <div className={(core.filePanelMode != "row")?"f-l-inline":"f-l-inline-full"}>{ file.name }</div>{this.renderExtra()} */}
                            <div className={"f-l-inline"}>{ file.name }</div>{this.renderExtra()}
                        </div>
                        
                    </FlexBandItem>
                </FlexBand>
                <Menu 
                    open={this.state.rightClickMenuOpen} 
                    id="rclick-menu" 
                    onClose={this.handleClickMenu} 
                    anchorEl={this.state.menuElement}
                    anchorOrigin={{
                        horizontal: 'right',
                    }}
                >
                    <MenuItem> Copy </MenuItem>
                    <MenuItem> RenMov </MenuItem>
                    <MenuItem onClick={
                        (() => {
                            file.manager.deleteFiles(file, true);
                            this.setState({rightClickMenuOpen: false})
                        })
                    }> Delete </MenuItem>
                    {(!file.isDir)? (<MenuItem onClick={(() => {file.manager.readFile(file)})} > Edit </MenuItem>):null}
                </Menu>
            </FlexBandItem>
            
        );
    }
}

const sflStyle = {      
    height: "100%",
    minHeight: "100%",
    minWidth: "100%",
    backgroundColor: "#37474F",
    color: "#E8EAF6",
};

class SimpleFileListContainer extends Component {
    constructor(props, ...other) {
        super(props, ...other);

        this.state = {
            currentIndex: 2,
            selected: 0,
            regDbClick: 0,
            preventSelection: false,
            mousePosition: null,
            resizeTarget: null,
            columnSizes: [],
            isResizing: false,
            prevTargetWidth: null,
            eventId: null,
            targetWidth: null,
            filePanelMode: 'column',

        }
        this.holderElement = null;
    }

    componentDidMount() {
        this.mount = true;
        window.addEventListener("mouseup", this.handleSplitterMouseUp);
        window.addEventListener("mousemove", this.handleSplitterDrag);
        core.on("keyDown", this.handleKeyDown);
        core.on('changeSelectedFile', this.handleChangeSelected);
        core.on("updateItems", this.updateColumns);
        core.ipc.on('fastCopyFileCallback', this.fastCopyFileCallback);
        this.props.manager.on("refresh", this.handleRefresh).
            on("focusOn", this.handleChangeCurrent);
        this.props.manager.on("gotFileContent", this.handleFileContent);
        let additionalColumns = localStorage.getItem("additionalColumns");
        let options = (additionalColumns)?additionalColumns.split("~*~"):[];

        this.state.columnSizes.push(300);
        options.forEach(() => {
            this.state.columnSizes.push(0);
        });
    }

    componentWillUnmount() {
        this.mount = false;
        window.removeEventListener("mouseup", this.handleSplitterMouseUp);
        window.removeEventListener("mousemove", this.handleSplitterDrag);
        core.off("keyDown", this.handleKeyDown);
        core.off('changeSelectedFile', this.handleChangeSelected);
        core.off("updateItems", this.updateColumns);
        core.ipc.removeListener('fastCopyFileCallback', this.fastCopyFileCallback);
        this.props.manager.off("refresh", this.handleRefresh).
            off("focusOn", this.handleChangeCurrent);
    }

    handleFileContent = (event, data) => {
        console.log(data);
    }

    fastCopyFileCallback = (event, status, err) => {
        if (status == 'cut') {
            let firstFile;
            core.pastingFiles.files.forEach((file, index) => {
                file.action = "copy"
                if (index == 0) {
                    firstFile = file.name
                }
                core.ipc.send('deleteFilesPerm', [file.name], file.path);
            })

            let timeout = setTimeout(() => {
                this.props.files.forEach((file) => {
                    if (file.name == firstFile) {
                        core.emit("changeSelectedFile", file.index);
                    }
                })
            }, 200);

            core.pastingFiles = {
                files: [],
                action: ''
            }
        } else if (status == "ERR") {
            console.log('fastCopyFile ERR: ', err);
        } else if (status == 'copy') {
            let firstFile = core.pastingFiles.files[0].name;

            let timeout = setTimeout(() => {
                this.props.files.forEach((file) => {
                    if (file.name == firstFile) {
                        core.emit("changeSelectedFile", file.index);
                    }
                })
            }, 200);
        }
    }

    updateColumns = () => {
        let options = localStorage.getItem("additionalColumns").split("~*~");
        let diff = options.length - (this.state.columnSizes.length-1);
        if (diff > 0 ) {
            for (let i=0; i<diff; i++) {
                this.state.columnSizes.push(0);
            }
            this.forceUpdate();
        } else if (diff < 0) {
            for (let i=+diff-1; i>0; i--) {
                this.state.columnSizes.splice(i, 1);
            }
            this.forceUpdate();
        }
    }

    setCurrentIndex(newIndex) {
        this.props.manager.currentIndex = newIndex;
        this.setState({ currentIndex: newIndex });
    }

    handleChanging = (event, index) => {
        if (this.props.isFocused) {
            this.setCurrentIndex(index);
        }
    }

    handleChangeCurrent = (event, index) => {
        this.setCurrentIndex(index);
    }   

    compareProps(p1, p2) {
        const result = (
            p1.files === p2.files && 
            p1.hasSelected === p2.hasSelected && 
            p1.manager === p2.manager &&
            p1.isFocused === p2.isFocused
        );
        return result;
    }

    compareState(s1, s2) {
        return (s1.currentIndex === s2.currentIndex ) 
    }

    handleRefresh = () => {
        this.forceUpdate();
    }


    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const nextIdx = nextState.currentIndex;
        const currentIndex = this.state.currentIndex;
        const okProps = this.compareProps(nextProps, this.props);
        const okState = this.compareState(nextState, this.state);

        if (okProps && okState) {
            return false;
        } else if (nextIdx != currentIndex && okProps) {
            const files = this.props.files;
            const nextFile = files[nextIdx];
            const file = files[currentIndex];

            if (nextFile) {
                nextFile.isCurrent = true;
                if (nextFile.e) {
                    nextFile.e.forceUpdate();
                }
            }

            if (file && nextFile != file) {
                file.isCurrent = false;
                if (file.e) {
                    file.e.forceUpdate();
                }
            }
            return false;
        } else {

            if (nextProps.files !== this.props.files) {
                if (nextProps.dirChanged) {
                    let newIndex = 0;
                    const prev = nextProps.prevSubPath;
                    if (prev) {
                        nextProps.files.find((file, index) => {
                            if (file.name === prev) {
                                newIndex = index;
                                return true;
                            }
                        });
                    }
                    this.setCurrentIndex(newIndex);
                }
            }

            return true;
        }
    }


    getCurrentElement() {
        return window.document.getElementById("f" + this.props.panelId + "." + this.state.currentIndex);
    }

    getCurrentElementRect() {
        const e = this.getCurrentElement();
        if (e) {
            return e.getBoundingClientRect()            
        } 
    }

    getElement(index) {
        return window.document.getElementById("f" + this.props.panelId + "." + index);
    }

    getElementRect(index) {
        const e = this.getElement(index);
        if (e) {
            return e.getBoundingClientRect()            
        } 
    }

    open( file ) {
        if (file) {
            if (file.isDir) {
                core.emit("openDir", this.props.panelId, file);
            }
        }
    }

    findFL(e, maxDepth) {
        if (e && maxDepth) {
            if (e.classList.contains("f-l")) {
                if (e.id && e.id.startsWith("f")) {
                    return (e.id.startsWith("f" + this.props.panelId + ".")) ? e : null;
                }
            }
            return (e === this.holderElement) ? null : (this.findFL(e.parentElement, maxDepth-1));
        } 
        return null;
    }

    findOnSide(x, top, bottom) {
        return this.findFL(document.elementFromPoint(x, (top + bottom) / 2), 10) 
                    || this.findFL(document.elementFromPoint(x, top), 10)
                    || this.findFL(document.elementFromPoint(x, bottom), 10);
    }

    getElementId(index) {
        return "f" + this.props.panelId + "." + index;
    }

    selectIndexWithcheck(index, element, select, unselect) {
        const currentIndex = this.state.currentIndex;
        const e = element ? element : document.getElementById(this.getElementId(index));

        if (e && this.holderElement) {
            const hr = this.holderElement.getBoundingClientRect();
            const r = e.getBoundingClientRect();

            if (hr && r) {
                let block = false;
                let scrollBy = 0;
                if (r.left < hr.left || r.top < hr.top)  {
                    scrollBy = r.left - hr.left;
                    block = "start";
                    this.holderElement.scrollLeft += scrollBy;
                }

                if (r.right > hr.right || r.bottom > hr.bottom ) {
                    scrollBy = r.right - hr.right;

                    if ( r.left + scrollBy < hr.left ) {
                        scrollBy = r.left - hr.left;
                    }

                    this.holderElement.scrollLeft += scrollBy;

                    block = "end";
                }

                if (block) {
                    e.scrollIntoView({ inline: block });
                }
            }
                         
        }
        this.setCurrentIndex(index);
        
        if (select || unselect) {
            const fl = currentIndex < index ? 
                this.props.files.slice(currentIndex, index) :
                this.props.files.slice(index+1, currentIndex+1);

            this.props.manager.selectMultipleFiles(fl, select ? true : false);
        }
            
    }

    moveSide({ toRight, maxIndex, select, unselect }) {
        let f, e, r, id;
        const diff = Math.round((window.devicePixelRatio * 160) / 10 );
        const currentIndex = this.state.currentIndex;
        
        r = this.getCurrentElementRect();
        
        if (r) {
            e = this.findOnSide(toRight ? r.right + 2 + diff : r.left - 2 - diff, r.top, r.bottom);

            e = this.findFL(e, 20);
            
            if (!e && this.holderElement) {
                const allRect = this.holderElement.getBoundingClientRect();

                if (allRect && r.height) {
                    const itemsPerHeight = allRect.height / r.height;
                    
                    let newIndex = Math.round(this.state.currentIndex + ( toRight ? 1 : -1 ) * itemsPerHeight);

                    if (newIndex < 0) {
                        return this.selectIndexWithcheck(0, select, unselect);
                    } else if (newIndex > maxIndex) {
                        newIndex = maxIndex;
                    }

                    const files = this.props.files;
                    const panelId = this.props.panelId;
                    let nr = this.getElementRect(newIndex);

                    if (nr) {
                        const nLeft = nr.left;

                        if (nr.right < r.left - maxColumnWidth) {
                            while (nr && newIndex < currentIndex - 1 && nr.right < r.left - maxColumnWidth) {
                                nr = this.getElementRect(++ newIndex);
                            }    
                        } else if (nr.left > r.right + maxColumnWidth) {
                            while (nr && newIndex > currentIndex + 1 && nr.left > r.right + maxColumnWidth) {
                                nr = this.getElementRect(-- newIndex);
                            }    
                        }
                        
                        if (!nr) return this.selectIndexWithcheck(newIndex, select, unselect);
                        
                        if (nr.top > r.top && nLeft != r.left) {
                            while (nr.top > r.top && newIndex > 0 && newIndex > currentIndex + 1) {
                                nr = this.getElementRect(newIndex-1);

                                if (!nr || nLeft != nr.left) {
                                    break;
                                }
                                newIndex --;
                            }
                        } else {
                            while (nr.bottom < r.top && newIndex < maxIndex-1) {
                                nr = this.getElementRect(newIndex + 1);

                                if (!nr || nLeft != nr.left) {
                                    break;
                                }

                                newIndex ++;
                            }
                        }
                    }
                                        
                    return this.selectIndexWithcheck(newIndex, select, unselect);
                }
            }


            if (e) {
                id = e.id;
                if (id) {
                    if (id.startsWith("f")) {
                        f  = id.indexOf(".");
                        if (f && id.substr(1, f-1) == this.props.panelId) {
                            f = parseInt(id.substr(f + 1));
                            if (f >= 0 && f <= maxIndex) {
                                this.selectIndexWithcheck(f, e, select, unselect);
                            }
                        }
                        return;
                    }
                } 
            }

            if (toRight) {
                if (files && id === ("pn" + this.props.panelId)) {
                    this.selectIndexWithcheck( maxIndex, select, unselect );
                }
            } else {
                this.selectIndexWithcheck( 0, select, unselect )
            }
        }
    }

    pageJump( direction, files ) {
        if (this.holderElement) {
            const r = this.holderElement.getBoundingClientRect();

            if (r) {
                const e = document.getElementById( this.getElementId(this.state.currentIndex) )
                    || document.getElementById( this.getElementId(0) );

                if (e) {
                    const eRect = e.getBoundingClientRect();

                    if (eRect && eRect.width && eRect.height) {

                        let columns = Math.floor(r.width / eRect.width);
                        if (columns < 1) columns = 1;

                        let rows = Math.floor(r.height / eRect.height);
                        if (rows < 1) rows = 1;

                        let newIndex = this.state.currentIndex;
                        if (!newIndex) newIndex = 0;

                        newIndex += direction * columns * rows;

                        if (newIndex < 0) {
                            newIndex = 0;
                        } else if (newIndex >= files.length ) {
                            newIndex = files.length - 1;
                        }

                        this.selectIndexWithcheck(newIndex);
                    }
                }
            }
        }

    }

    handleKeyDown = (eventType, event) => {
        console.log("key down: ", core.keyMapper.eventToKey(event));   

        if (core.shiftKeys[event.key]) {
            // todo: process shift key press here to highlight something useful
            
            return;
        }

        if (this.props.isFocused) {
            const state = this.state;
            const currentIndex = state.currentIndex;
            const files = this.props.files;
            const manager = this.props.manager;

            const file = (files && currentIndex >= 0 && currentIndex < files.length) ? files[currentIndex] : null;
            const cmd = core.keyMapper.mapKeyEvent(event, "filePanel", { 
                searchActive: manager.searchActive,
                fileSelected: file,
                dirSelected: (file && file.isDir),
                dialogOpened: core.dialogOpened
            });    

            let clearEvent = core.eventKeyModifiers(event) === 0;
            
            if (cmd) {
                console.log("CMD: ", cmd.command);

                const managerCmd = manager["command" + cmd.command.capitalize()];

                if (managerCmd) {
                    managerCmd({ file: file });

                } else {
                    switch(cmd.command) {
                        case "openFile":
                            this.props.manager.openFile(file, this.props.location.path);
                            break;
                        case "selectFileUp":
                            file.manager.selectFile(file, !file.selected);
                            if (currentIndex > 0) {
                                this.selectIndexWithcheck(currentIndex - 1);
                            } 
                            
                            break;
    
                        case "selectFileDown":
                            file.manager.selectFile(file, !file.selected);
                            if (currentIndex < files.length - 1) {
                                this.selectIndexWithcheck(currentIndex + 1);
                            }
                            break;
                        
                        case "selectFilesByType":
                            this.props.manager.filesSelectByType(file, true);

                            break;
                        
                        case "deselectFilesByType":
                            this.props.manager.filesSelectByType(file, false);

                            break;

                        case "selectColumnLeft":
                        case "selectColumnRight":
                            this.moveSide({ 
                                toRight: cmd.command === "selectColumnRight", 
                                maxIndex: files.length-1, 
                                select: file && !file.selected,
                                unselect: file && file.selected,
                             });
                            break;
    
                        case "selectFilesByColor":
                            this.props.manager.filesSelectByColor(file, true);
                            break;
                        case "deselectFilesByColor":
                            this.props.manager.filesSelectByColor(file, false);
                            break;
                        case "makeDir":
                            this.props.openActionDialog('mkDirDialog');
                            break;
                        case "move":
                            this.props.openActionDialog('renMovDialog');
                            core.emit("getPanelFile", this.props.manager, file);
                            break;
                        case "delete":
                            this.props.openActionDialog('deleteConfirmDialog');
                            this.props.manager.deleteFiles(file);
                            break; 
                        case 'changePanelMode':
                            for (let i = 0; i<core.filePanelAvaibleModes.length; i++) {
                                if (core.filePanelAvaibleModes[i] == this.state.filePanelMode && i != core.filePanelAvaibleModes.length-1) {
                                    this.setState({filePanelMode: core.filePanelAvaibleModes[i+1]});
                                    break;
                                } else if (i == core.filePanelAvaibleModes.length-1) {
                                    this.setState({filePanelMode: core.filePanelAvaibleModes[0]});
                                    break;
                                }
                            }
                            this.forceUpdate();
                            break;
                        case 'editFile':
                            this.props.manager.readFile(file) 
                            break;
                        case 'copyFile':
                            core.emit("getPanelFile", this.props.manager, file);
                            this.props.openActionDialog('copyFileDialog');
                            break;
                        case 'fastCutFile':
                            this.props.manager.cutCopyFiles(file, 'cut');
                            break;
                        case 'fastCopyFile':
                            this.props.manager.cutCopyFiles(file, 'copy');
                            break;
                        case 'pasteFile':
                            this.props.manager.pasteFiles();
                            break;
                    
                        default: 
                            console.log("There is no action assigned on this key combination")
                    }
                }

                event.preventDefault();
                return;
            }

            if (clearEvent) {
                switch(event.key) {
                    case "ArrowUp":
                        if (currentIndex > 0) {
                            this.selectIndexWithcheck(currentIndex - 1);
                        }
                        break;

                    case "ArrowDown":
                        
                        if (files && currentIndex < files.length - 1) {
                            this.selectIndexWithcheck(currentIndex + 1);
                        }
                        break;

                    case "ArrowRight":
                        this.moveSide({ toRight: true, maxIndex: files.length-1, });
                        break;

                    case "ArrowLeft":
                        this.moveSide({ toRight: false, maxIndex: files.length-1, });
                        break;

                    case "Home":
                        
                        if (files && files.length > 0) {
                            this.selectIndexWithcheck( 0 );
                        }
                        break;

                    case "End":
                        
                        if (files && files.length > 0) {
                            this.selectIndexWithcheck( files.length -1 );
                        }
                        break;

                    case "PageUp":
                        
                        if (files && files.length > 0) {
                            this.pageJump( -1, files );
                        }
                        break;

                    case "PageDown":
                        
                        if (files && files.length > 0) {
                            this.pageJump( +1, files );
                        }
                        break;
                    case "Shift+ArrowDown":
                        if (files && currentIndex < files.length - 1) {
                            this.selectIndexWithcheck(currentIndex + 1);
                        }
                        break;
                    default:

                        clearEvent = false;
                        
                }
            } else {

            }

            if (clearEvent) {
                event.preventDefault();
            }
        }
    }

    handleClick(file) {
        let regDbClick = this.state.regDbClick + 1;
        this.setState({
            regDbClick: regDbClick,
            preventSelection: true,
        });
        this.forceUpdate()
        let ifCase = !core.isAltPressed && !core.isShiftPressed && !core.isControlPressed && !core.isMetaPressed && regDbClick == 2;
        if (ifCase && file.isDir) {
            this.props.manager.commandOpenDir({file});
        } else if (ifCase && !file.isDir) {
            this.props.manager.openFile(file, this.props.location.path);
        }

        var dbcTimeout = setTimeout(() => {
            this.setState({regDbClick: 0});
        }, 400);

        var selectionTimeout = setTimeout(() => {
            this.setState({preventSelection: false})
            this.forceUpdate()
        }, 1000);

        if (core.isShiftPressed) {
            let selectingFiles;
            let onOff;
            if (this.state.currentIndex < file.index+1) {
                selectingFiles = this.props.files.slice(this.state.currentIndex, file.index+1);
            } else {
                selectingFiles = this.props.files.slice(file.index, this.state.currentIndex+1);

            }
            if (this.props.files[this.state.currentIndex].selected && file.selected) {
                onOff = false;
            } else {
                onOff = true;
            }
            
            this.props.manager.selectMultipleFiles(selectingFiles, onOff);
        }

        if (file) {
            this.setCurrentIndex(file.index);
        }

        if (this.props.onFocus) {
            this.props.onFocus();
        }

        if (!this.props.isFocused) {
            this.props.onFocusRequest();
        }
    }

    handleSplitterMouseDown = (event) => {
        let id = event.target.id.split('-')[1];
        let elementWidth = document.getElementById(this.props.panelId + "column-"+id).offsetWidth;
        let prevElementWidth = document.getElementById(this.props.panelId + "column-"+(id-1).toString()).offsetWidth;
        this.setState({
            mousePosition: event.clientX,
            resizeTarget: event,
            eventId: event.target.id,
            targetWidth: elementWidth,
            prevTargetWidth: prevElementWidth,
            isResizing: true,
        });

        this.resizeTicks = 5;
    }

    handleSplitterMouseUp = () => {
        if (this.state.isResizing) {
            this.setState({
                mousePosition: null,
                isResizing: false,
                resizeTarget: null,
                targetWidth: null,
                prevTargetWidth: null,
            });
        }
        
    }

    handleSplitterDrag = (event) => {
        if (this.state.isResizing) {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = 0;

                if (this.resizeTicks-- == 0){
                    this.forceUpdate();
                    this.resizeTicks = 5;
                }
            }
            let delta = this.state.mousePosition - event.clientX;
            let id = this.state.eventId.split('-')[1];
            
            let columnSizes = this.state.columnSizes;

            if (id == columnSizes.length - 1 && this.state.eventId.includes('sec')) {
                columnSizes[id] = this.state.targetWidth - delta
            } else {
                columnSizes[id-1] = this.state.prevTargetWidth - delta
            }

            this.resizeTimeout = setTimeout((event) => {
                this.resizeTimeout = 0;
                
                this.forceUpdate();
            }, 100);

        }
    }

    render() {
        let disableSelection = (this.state.preventSelection)? "disable-selection":""
        let options = this.state.columnSizes.slice(1, this.state.columnSizes.length-1);
        let panelMode = (core.filePanelMode == 'row')? ' flex-mod-row' : ''
        let self = this;
        const {
            currentIndex,
        } = this.state;
        const {
            isFocused,
            panelId,
        } = this.props;
        let gridSize = "";
        let columns = this.state.columnSizes;

        for (let i=0; i<columns.length; i++) {
            if (columns[i] == 0) {
                gridSize += "auto "
            } else {
                gridSize += columns[i] + 'px '
            }
        }

        return (
            (this.state.filePanelMode == "column")?
            <div 
                className="h-scroll full-height" style={sflStyle}
                ref={ element => this.holderElement = element }
            >
                <FlexBand 
                    direction={'column'} 
                    className={"flex-compact-start" + panelMode }
                    style={sflStyle}  
                    id={ "pn"+panelId }
                >
                    { this.props.files.map( (file, index) => {
                        file.index = index;
                        file.isCurrent = currentIndex === index;
                        return (
                            <SimpleFileLine 
                                className={disableSelection}
                                key={file.name}
                                isFocused={isFocused}
                                hasCheckbox={this.props.hasSelected}
                                filePanelMode={this.state.filePanelMode}
                                file={file}  
                                onClick={ () => this.handleClick(file) }
                                ref={ e => { file.e = e; } }
                            />
                        );
                    }) }
                </FlexBand>
            </div>:
            <div 
                className="h-scroll full-height" style={sflStyle}
                ref={ element => this.holderElement = element }
            >
                <div className="grid-container" style={{gridTemplateColumns: gridSize}}>
                    {this.state.columnSizes.map((size, index) => {
                        if (index == 0) {
                            return (
                                <div key={index} id={this.props.panelId+"column-0"}>
                                    File
                                </div>
                            )
                        } else if (index == this.state.columnSizes.length-1) {
                            return (
                                <div key={index} id={this.props.panelId+"column-"+index} style={{paddingRight: 4}} className="grid-option">
                                <FlexBand key={index} direction={'row'} style={{flexWrap: 'nowrap'}}>
                                    <div id={this.props.panelId+'-' + index} className="grid-col-splitter" onMouseDown={this.handleSplitterMouseDown}>
                                    </div>
                                    <FileOption id={this.props.panelId+"column-" + index} type="name" position={index-1} />
                                    <div id={this.props.panelId+'sec'+'-'+index} className="grid-col-splitter" style={{paddingLeft: 2}} onMouseDown={this.handleSplitterMouseDown}>
                                    </div>
                                </FlexBand>
                                </div>
                            )
                             
                        } else {
                            return (
                                <div key={index} id={this.props.panelId+"column-"+index} style={{paddingRight: 4}} className="grid-option">
                                <FlexBand key={index} direction={'row'} style={{flexWrap: 'nowrap'}}>
                                    <div id={this.props.panelId+'-'+index} className="grid-col-splitter" onMouseDown={this.handleSplitterMouseDown}>
                                    </div>
                                    <FileOption id={this.props.panelId+"column-" + index} type="name" position={index-1} />
                                </FlexBand>
                                </div>
                            )
                        }
                    })}
                    
                    { this.props.files.map( (file, index) => {
                        file.index = index;
                        file.isCurrent = currentIndex === index;
                        return [
                            <div key={file.name}>
                                <SimpleFileLine 
                                    className={disableSelection}
                                    key={file.name}
                                    isFocused={isFocused}
                                    hasCheckbox={this.props.hasSelected}
                                    file={file}  
                                    onClick={ () => this.handleClick(file) }
                                    filePanelMode={this.state.filePanelMode}
                                    ref={ e => { file.e = e; } }
                                />
                                
                            </div>,
                            columns.map((size, index) => {
                                if (index >= 1) {
                                    return(
                                        <div key={index} className="grid-option">
                                            <FileOption 
                                                type="option" 
                                                className="file-size-full" 
                                                position={index-1} 
                                                file={file} 
                                                filePanelMode={this.state.filePanelMode}
                                            />
                                        </div>
                                    )
                                    
                                }
                                
                            })
                        ];
                    }
                    ) }

                </div>

            </div>
        );
    }
}


export default class FilePanel extends Component {

    constructor(props, ...other) {
        super(props, ...other);

        this.state = {
            loading: true,
            files: null,
            hasSelected: false,
        };

        this.setManager(props.manager);
    }

    setManager(newManager) {
        if (newManager) {
            newManager.on("files", this.handleGetFiles).
                on("refresh", this.handleRefresh).
                on("searchOpen", this.handleSearchOpen).
                on("hasSelected", this.handleSelectedChange);
            }
    }

    componentWillReceiveProps(props) {
        const manager = this.props.manager;
        if (props.manager != manager) {
            if (manager) {
                manager.off("files", this.handleGetFiles).
                    off("refresh", this.handleRefresh).
                    off("searchOpen", this.handleSearchOpen).
                    off("hasSelected", this.handleSelectedChange);
            }
            this.setManager(props.manager);
        }
    }

    componentDidMount() {
        this.mount = true;
        this.props.manager.readFiles();
    }

    componentWillUnmount() {
        this.mount = false;
    }

    handleSearchOpen = (event, onOff) => {
        if (onOff && this.props.onFocusRequest) {
            this.props.onFocusRequest();
        }
    }

    handleRefresh = () => {
        if (this.mount) {
            this.forceUpdate();
        }
    }

    handleGetFiles = (event, { location, files, prevSubPath, }) => {
        this.setState( { 
            files: files, 
            location: location, 
            dirChanged: true,
            prevSubPath: prevSubPath,
            loading: false, 
            hasSelected: this.props.manager.selectedCount > 0,
        } );
    }

    handleSelectedChange = (event, hasSelected) => {
        this.setState({ hasSelected: hasSelected });
        this.forceUpdate();
    }

    render() {
        const {
            files,
            loading,
        } = this.state;

        if (this.state.dirChanged) {
            setTimeout(()=>(this.setState({ dirChanged: false, prevSubPath: "" })), 1000);
        }

        return (
            <ReflexElement>  
                {                  
                (files) ? (
                    <SimpleFileListContainer 
                        openActionDialog={this.props.openActionDialog}
                        files={files} 
                        isFocused={this.props.isFocused} 
                        panelId={this.props.panelId}
                        hasSelected={this.state.hasSelected}
                        onFocusRequest={this.props.onFocusRequest}
                        partId={this.props.partId}
                        manager={this.props.manager}
                        dirChanged={this.state.dirChanged}
                        prevSubPath={this.state.prevSubPath}
                        location={this.props.defaultLocation}
                    />
                ) : ln3.text("file.panel.file.list.empty", "No files found")
                }
            </ReflexElement>                
        );
    }
}

