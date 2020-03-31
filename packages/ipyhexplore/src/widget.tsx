// Copyright (c) Adrian Vogelsgesang
// Distributed under the terms of the Modified BSD License.

import {DOMWidgetModel, DOMWidgetView, ISerializers, ManagerBase} from "@jupyter-widgets/base";

import {MODULE_NAME, MODULE_VERSION} from "./version";

import React from "react";
import ReactDOM from "react-dom";
import {HexViewer, defaultConfig, HexViewerConfig, HighlightRange, Range} from "hexplore-hexview";

// Import the CSS
import "../css/hexview.css";
import "hexplore-hexview/dist/hexview.css";

function deserializeBytes(obj: DataView | null, _manager?: ManagerBase<any>): ArrayBuffer | null {
    if (obj == null) {
        return null;
    }
    return obj.buffer.slice(obj.byteOffset, obj.byteOffset + obj.byteLength);
}

export class HexViewerModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name: HexViewerModel.model_name,
            _model_module: HexViewerModel.model_module,
            _model_module_version: HexViewerModel.model_module_version,
            _view_name: HexViewerModel.view_name,
            _view_module: HexViewerModel.view_module,
            _view_module_version: HexViewerModel.view_module_version,
            data: new ArrayBuffer(0),
            linewidth: 16,
            columns: defaultConfig,
            cursor_position: 0,
            selection_from: 0,
            selection_to: 1,
            highlight_ranges: [],
        };
    }

    static serializers: ISerializers = {
        ...DOMWidgetModel.serializers,
        data: {deserialize: deserializeBytes},
    };

    static model_name = "HexViewerModel";
    static model_module = MODULE_NAME;
    static model_module_version = MODULE_VERSION;
    static view_name = "HexViewerView"; // Set to null if no view
    static view_module = MODULE_NAME; // Set to null if no view
    static view_module_version = MODULE_VERSION;
}

interface PyHightlightRanges {
    from: number;
    to: number;
    style: string;
}

export class HexViewerView extends DOMWidgetView {
    selection: Range = {from: 0, to: 1};
    columnConfig: HexViewerConfig = defaultConfig;
    highlightRanges: HighlightRange[] = [];

    render() {
        super.render();

        this.model.on({
            "change:data": () => this.redraw(),
            "change:cursor_position": () => this.redraw(),
            "change:linewidth": () => {
                this.rebuildColumnConfig();
                this.redraw();
            },
            "change:columns": () => {
                this.rebuildColumnConfig();
                this.redraw();
            },
            "change:selection_from": () => {
                this.rebuildSelection();
                this.redraw();
            },
            "change:selection_to": () => {
                this.rebuildSelection();
                this.redraw();
            },
            "change:highlight_ranges": () => {
                this.rebuildHighlightRanges();
                this.redraw();
            },
        });
        this.rebuildHighlightRanges();
        this.rebuildColumnConfig();
        this.el.classList.add("hv-widget-container");
        this.redraw();
    }

    rebuildSelection() {
        this.selection = {
            from: this.model.get("selection_from"),
            to: this.model.get("selection_to"),
        };
    }

    rebuildColumnConfig() {
        this.columnConfig = {
            lineWidth: this.model.get("linewidth"),
            columns: this.model.get("columns"),
        };
    }

    rebuildHighlightRanges() {
        const rawRanges: Array<PyHightlightRanges> = this.model.get("highlight_ranges");
        this.highlightRanges = rawRanges.map(function(r, i): HighlightRange {
            return {from: r.from, to: r.to, className: "hv-highlight-" + r.style, key: "h" + i};
        });
        console.log(this.highlightRanges);
    }

    redraw() {
        const data = this.model.get("data");
        const cursorPosition: number = this.model.get("cursor_position");
        const setSelection = (range: Range) => {
            this.model.set({selection_from: range.from, selection_to: range.to});
            this.model.save_changes();
        };
        ReactDOM.render(
            <HexViewer
                data={data}
                viewConfig={this.columnConfig}
                cursorPosition={cursorPosition}
                setCursorPosition={pos => {
                    this.model.set("cursor_position", pos);
                    this.model.save_changes();
                }}
                selection={this.selection}
                setSelection={setSelection}
                highlightRanges={this.highlightRanges}
            />,
            this.el,
        );
    }
}
