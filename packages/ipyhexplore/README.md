
# ipyhexplore

[![Build Status](https://travis-ci.org//ipyhexplore.svg?branch=master)](https://travis-ci.org//ipyhexplore)
[![codecov](https://codecov.io/gh//ipyhexplore/branch/master/graph/badge.svg)](https://codecov.io/gh//ipyhexplore)


A Hex-Viewer widget for Jupyter

## Installation

You can install using `pip`:

```bash
pip install ipyhexplore
```

Or if you use jupyterlab:

```bash
pip install ipyhexplore
jupyter labextension install @jupyter-widgets/jupyterlab-manager
```

If you are using Jupyter Notebook 5.2 or earlier, you may also need to enable
the nbextension:
```bash
jupyter nbextension enable --py [--sys-prefix|--user|--system] ipyhexplore
```
