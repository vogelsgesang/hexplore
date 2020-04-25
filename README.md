# Hexplore

A simple web-based Hex Viewer

Available either as a [standalone web app](https://vogelsgesang.github.io/hexplore/) or as a JupyterLab plugin (you can [try it on Binder](https://mybinder.org/v2/gh/vogelsgesang/hexplore/master?urlpath=lab)).

## Development

This repository is a monorepo consisting of three independent sub-packages:
* `packages/hexview` provides the core rendering capabilities, i.e. displaying binary data in a grid-like interface
* `packages/standalone` contains the standalone web-app
* `packages/ipyhexplore` provides an interactive ipywidget for JupyterLab

To setup this repository, you will need `yarn` instead of `npm`.


### Working on the standalone frontend

To create a Release build of the standalone frontend, run the following steps:
```
yarn install
yarn run --cwd=packages/hexview build
yarn run --cwd=packages/standalone build
```
and find the built files in `packages/standalone/dist`.

During development, I recommend to use `yarn run --cwd=packages/standalone dev-server` which will spawn a local webserver with auto-reload enabled. Changes in `packages/standalone` will be directly picked up by the dev-server. In case you modify files in `packages/hexview`, you will have to run `yarn run --cwd=packages/hexview build` manually.

### Working on the JupyterLab plugin

The JupyterLab consists of both a Python package (to be called from within your notebooks) and a frontend extensions to be loaded into the frontend.

The Python package can be installed by running `pip install packages/ipyhexplore`.

To install the frontend extension in JupyterLab, use
```
jupyter labextension install @jupyter-widgets/jupyterlab-manager
jupyter labextension link packages/hexview
jupyter labextension install packages/ipyhexplore
```
