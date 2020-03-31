import React, {KeyboardEvent} from "react";
import ReactDOM from "react-dom";
import {HighlightRange, Range, HexViewer, HexViewerConfig, defaultConfig} from "hexplore-hexview";
import {HexViewerConfigEditor} from "./HexViewerConfigEditor";
import {FileOpener} from "./FileOpener";

import "hexplore-hexview/dist/hexview.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

interface AppState {
    data?: ArrayBuffer;
    cursorPosition: number;
    selection: Range;
    highlighted: Array<HighlightRange>;
    viewConfig: HexViewerConfig;
}

const styles: Array<string> = [
    "hv-highlight-red",
    "hv-highlight-green",
    "hv-highlight-blue",
    "hv-highlight-underline-red",
    "hv-highlight-underline-green",
    "hv-highlight-underline-blue",
];

class App extends React.Component<{}, AppState> {
    state: AppState = {
        data: undefined,
        cursorPosition: 0,
        selection: {from: 0, to: 1},
        highlighted: new Array<HighlightRange>(),
        viewConfig: defaultConfig,
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
                                height: "100%",
                                overflow: "auto",
                                borderLeft: "1px solid #999",
                                background: "#fcfcfc",
                            }}
                        >
                            <HexViewerConfigEditor
                                config={this.state.viewConfig}
                                setConfig={c => this.setState({viewConfig: c})}
                            />
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
