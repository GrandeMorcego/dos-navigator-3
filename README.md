# Dos Navigator III


<!-- [![MIT][mit-image]][mit-url] -->

> A cross-platform file manager 


<!-- [mit-image]: https://github.com/stanurkov/observed-object/blob/master/mit.svg -->
<!-- [mit-url]: https://gitlab.com/stanurkov//blob/master/LICENSE -->


## Introduction

Dos Navigator III is a project based on Electron JS by the son of the original author of Dos Navigator from 1990s



#### Installation

Pre-requisites: NodeJS (v8.4 or later) and Yarn package manager should be installed on your system


After you have this project cloned onto your system, proceed with Node JS environment setup:

```sh
cd dn3
yarn install
```

Note: various systems may require some specific packages to be installed in order to build Electron run-time 

#### Running a developer's build


Electron JS applications currently require two processes to be run simultaneously. 

The first one is Front-end packaging served by WebPack dev-server:

```sh
cd dn3/
yarn start-dev
```

The second one is Electron JS itself. So, open a new terminal window and 

```sh
cd dn3/
export NODE_ENV=dev && yarn start
```

(on Windows, use "set" instead of "export" to set and environment variable)


### Building a productions package

To prepare a production package, the front-end should be built first. Note that on first stages of the development no minification and other optimization is performed 

```sh
cd dn3/
yarn build
```

Once the front-end is built, it is possible to either prepare a package containing all necessary binaries (specific to the system  which the package is build on)

```sh
export NODE_ENV=prod && yarn package
```

or prepare an installation package ready to be distributed:

```sh
export NODE_ENV=prod && yarn make
```

in either case, the output files will be placed into dedicated subdirectory of the dn3/out directory