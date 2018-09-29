import React from 'react';
import FolderOpen from '@material-ui/icons/FolderOpen';
import File from '@material-ui/icons/InsertDriveFile';
import Settings from '@material-ui/icons/Settings';
import Swift from '../../icons/languages/swift.svg';
import JavaScript from '../../icons/languages/javascript.svg';
import TypeScript from '../../icons/languages/typescript.svg';
import CLang from '../../icons/languages/c.svg';
import CPP from '../../icons/languages/cpp.svg';
import GoLang from '../../icons/languages/go.svg';
import Python from '../../icons/languages/python.svg';
import Lua from '../../icons/languages/lua.svg';
import Php from '../../icons/languages/php.svg';
import Archive from '../../icons/zip-box.svg';
import Executable from '../../icons/executable.svg';
import HTML from '../../icons/languages/html.svg';


export default class IconManager extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        }
        this.icons = {
            ".JS": JavaScript,
            ".SWIFT": Swift,
            ".TS": TypeScript,
            ".C": CLang,
            ".CPP": CPP,
            ".GO": GoLang,
            ".PY": Python,
            ".PHP": Php,
            ".LUA": Lua,
            ".EXE": Executable,
            ".DEB": Executable,
            ".DMG": Executable,
            ".ZIP": Archive,
            ".RAR": Archive,
            ".XZ": Archive,
            ".GZ": Archive,
            ".7Z": Archive,
            ".HTML": HTML

        }
    }

    render() {
        let icon = this.icons[this.props.fileExtention]
        let isDir = this.props.isDir;
        let style = {};
        if (this.props.style) {
            let style = this.props.style;
            style.fill = '#d3d32c';
        } else {
            style.fill = '#d3d32c';
        }
        
        return (
            <span>
                {
                    (icon && !isDir) ? 
                        <img 
                            src={icon} 
                            className={this.props.className} 
                            style={this.props.style} 
                        /> : 
                    (!icon && !isDir) ? 
                        <File 
                            style={style} 
                            className={this.props.className}
                        /> : 
                        <FolderOpen 
                            style={style} 
                            className={this.props.className}
                        /> 
                }
            </span>

        )
    }
    }