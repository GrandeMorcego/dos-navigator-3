# Dos Navigator III


<!-- [![MIT][mit-image]][mit-url] -->

> A cross-platform file and command line manager 


<!-- [mit-image]: https://github.com/stanurkov/observed-object/blob/master/mit.svg -->
<!-- [mit-url]: https://gitlab.com/stanurkov//blob/master/LICENSE -->


## Introduction

Dos Navigator III is an experimental project based on Electron JS started by the original author of Dos Navigator from 1990s

The main idea behind this project is to explore possibilities of cross-platform development provided by Electron JS, Node JS and all JS ecosystem in general. If we can develop a reasonably good tool for developers while we are playing around, it would be a great bonus :-)


#### Installation

Pre-requisites: NodeJS and Yarn package manager should be installed on your system


After you have this project cloned onto your system:

```sh
cd dn3/local
copy settings-sample.js settings.js 
cd ..
```

The **settings.js** file contains system-specific settings that can be adjusted in order to make DN3 run properly. This file is supposed to be ignored by Git, so feel free to edit it as you like. Currently, only **settings.startPath** affects the program, we'll see if anything else will be needed or we will use a more elegant way to inject developer-specific defaults. 

When you have your settings ready, proceed with Node JS environment setup:

```sh
cd dn3
yarn install
```

#### Running a developer's build

Electron JS applications currently require two processes to be run simultaneously. 

The first one is Front-end packaging served by WebPack dev-server:

```sh
yarn start
```

The second one is Electron JS itself. So, open a new terminal window and 

```sh
cd dn3/
yarn electron
```

