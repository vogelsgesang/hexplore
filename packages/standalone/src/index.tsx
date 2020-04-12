import React, {KeyboardEvent} from "react";
import ReactDOM from "react-dom";
import {
    HighlightRange,
    Range,
    HexViewer,
    HexViewerConfig,
    defaultConfig
} from "hexplore-hexview";
import objstr from "hexplore-hexview/dist/objstr";
import {HexViewerConfigEditor} from "./HexViewerConfigEditor";
import {FileOpener} from "./FileOpener";
import {DataInspector} from "./DataInspector";

import "hexplore-hexview/dist/hexview.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { RendererConfig, createAddressRendererConfig, createIntegerRendererConfig } from "hexplore-hexview/dist/ByteRenderer";

interface AppState {
    data?: ArrayBuffer;
    cursorPosition: number;
    selection: Range;
    highlighted: Array<HighlightRange>;
    viewConfig: HexViewerConfig;
    activeSidebar: "columnConfig" | "dataInspector";
    dataInspectorRepresentations: RendererConfig[];
}

const styles: Array<string> = [
    "hv-highlight-red",
    "hv-highlight-green",
    "hv-highlight-blue",
    "hv-highlight-underline-red",
    "hv-highlight-underline-green",
    "hv-highlight-underline-blue",
];

const defaultInspectorRepresentations: RendererConfig[] = [
    createAddressRendererConfig(),
    createIntegerRendererConfig({displayBase: 10, width: 1, signed: true}),
    createIntegerRendererConfig({displayBase: 10, width: 2, signed: true}),
    createIntegerRendererConfig({displayBase: 10, width: 4, signed: true}),
    createIntegerRendererConfig({displayBase: 10, width: 8, signed: true}),
];

class App extends React.Component<{}, AppState> {
    state: AppState = {
        data: undefined,
        cursorPosition: 0,
        selection: {from: 0, to: 1},
        highlighted: new Array<HighlightRange>(),
        viewConfig: defaultConfig,
        activeSidebar: "columnConfig",
        dataInspectorRepresentations: defaultInspectorRepresentations,
    };
    nextStyle = 0;

    onKeyPress(e: KeyboardEvent<HTMLDivElement>) {
        if (e.key.toLowerCase() == "m" && !e.ctrlKey && !e.altKey && !e.metaKey) {
            if (!e.shiftKey) {
                // Add mark
                const key = "m" + new Date().getTime();
                const className = styles[this.nextStyle++ % styles.length];
                const newMark: HighlightRange = {...this.state.selection, className: className, key: key};
                const marks = this.state.highlighted.concat([newMark]);
                this.setState({
                    highlighted: marks,
                    selection: {from: this.state.cursorPosition, to: this.state.cursorPosition + 1},
                });
            } else if (e.shiftKey) {
                // Remove mark
                this.setState({highlighted: []});
                this.nextStyle = 0;
            }
        }
    }

    render() {
        if (!this.state.data) {
            return <FileOpener setData={d => this.setState({data: d})} />;
        } else {
            let sidebarContent;
            if (this.state.activeSidebar == "columnConfig") {
                sidebarContent = (
                    <HexViewerConfigEditor
                        config={this.state.viewConfig}
                        setConfig={c => this.setState({viewConfig: c})}
                    />
                );
            } else if (this.state.activeSidebar == "dataInspector") {
                sidebarContent = (
                    <DataInspector
                        data={this.state.data}
                        position={this.state.cursorPosition}
                        representations={this.state.dataInspectorRepresentations}
                    />
                );
            }

            return (
                <div
                    onKeyPress={e => this.onKeyPress(e)}
                    style={{display: "flex", flexDirection: "column", height: "100%", alignContent: "stretch"}}
                >
                    <div style={{flex: 1, minHeight: 0, display: "flex"}}>
                        <div style={{flex: 1, minWidth: 0, display: "flex"}}>
                            <HexViewer
                                data={this.state.data}
                                viewConfig={this.state.viewConfig}
                                cursorPosition={this.state.cursorPosition}
                                setCursorPosition={x => this.setState({cursorPosition: x})}
                                selection={this.state.selection}
                                setSelection={x => this.setState({selection: x})}
                                highlightRanges={this.state.highlighted}
                            />
                        </div>
                        <div
                            style={{
                                width: "15em",
                                overflow: "auto",
                                borderLeft: "1px solid #999",
                                background: "#fcfcfc",
                            }}
                        >
                            {sidebarContent}
                        </div>
                        <div className="sidebar-tabs">
                            <div
                                onClick={() => this.setState({activeSidebar: "columnConfig"})}
                                className={objstr({
                                    "sidebar-tab": true,
                                    selected: this.state.activeSidebar == "columnConfig",
                                })}
                            >
                                Column Config
                            </div>
                            <div
                                onClick={() => this.setState({activeSidebar: "dataInspector"})}
                                className={objstr({
                                    "sidebar-tab": true,
                                    selected: this.state.activeSidebar == "dataInspector",
                                })}
                            >
                                Data Inspector
                            </div>
                        </div>
                    </div>
                    <div style={{flex: 0, borderTop: "1px solid #999", background: "#fcfcfc"}}>
                        <span style={{padding: ".2em", display: "inline-block"}}>
                            position: {this.state.cursorPosition}
                        </span>
                    </div>
                </div>
            );
        }
    }
}

window.addEventListener("DOMContentLoaded", _event => {
    const domContainer = document.querySelector("#main");
    ReactDOM.render(<App />, domContainer);
});
