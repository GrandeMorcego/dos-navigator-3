# Dos Navigator III


<!-- [![MIT][mit-image]][mit-url] -->

> A cross-platform file manager 


<!-- [mit-image]: https://github.com/stanurkov/observed-object/blob/master/mit.svg -->
<!-- [mit-url]: https://gitlab.com/stanurkov//blob/master/LICENSE -->


## Introduction

Dos Navigator III is a project based on Electron JS by the son of the original author of Dos Navigator from 1990s



#### Installation

Pre-requisites: NodeJS and Yarn package manager should be installed on your system


After you have this project cloned onto your system, proceed with Node JS environment setup:

```sh
cd dn3
yarn install
```

#### Running a developer's build

Now you need to check if `const createWindow` in `./src/electron-main.js` file looks like this:

```javascript
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1500, 
        height: 900,
        title: 'Dos Navigator III',
    })
    mainWindow.loadURL("http://localhost:8888")
    // mainWindow.loadURL(`file://${__dirname}/../build/index.html`, { });
    
    mainWindow.on('closed', () => { mainWindow = null; });
}
```

Electron JS applications currently require two processes to be run simultaneously. 

The first one is Front-end packaging served by WebPack dev-server:

```sh
yarn start-dev
```

The second one is Electron JS itself. So, open a new terminal window and 

```sh
cd dn3/
yarn start
```

