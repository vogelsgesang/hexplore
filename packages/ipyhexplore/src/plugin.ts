// Copyright (c) Adrian Vogelsgesang
// Distributed under the terms of the Modified BSD License.

import {Application, IPlugin} from "@lumino/application";

import {Widget} from "@lumino/widgets";

import {IJupyterWidgetRegistry} from "@jupyter-widgets/base";

import * as widgetExports from "./widget";

import {MODULE_NAME, MODULE_VERSION} from "./version";

const EXTENSION_ID = "jupyter-hexplore:plugin";

/**
 * The HexViewer plugin.
 */
const hexViewerPlugin: IPlugin<Application<Widget>, void> = {
    id: EXTENSION_ID,
    requires: [IJupyterWidgetRegistry],
    activate: activateWidgetExtension,
    autoStart: true,
};

export default hexViewerPlugin;

/**
 * Activate the widget extension.
 */
function activateWidgetExtension(app: Application<Widget>, registry: IJupyterWidgetRegistry): void {
    registry.registerWidget({
        name: MODULE_NAME,
        version: MODULE_VERSION,
        exports: widgetExports,
    });
}
