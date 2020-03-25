import React, {KeyboardEvent, CSSProperties} from "react";
import ReactDOM from "react-dom";
import {HighlightRange, Range} from "./DataGrid";
import {HexViewer} from "./HexViewer";
import {HexViewerConfig, defaultConfig} from "./HexViewerConfig";
import {HexViewerConfigEditor} from "./HexViewerConfigEditor";

import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {FileOpener} from "./FileOpener";

interface AppState {
    data?: ArrayBuffer;
    cursorPosition: number;
    selection: Range;
    highlighted: Array<HighlightRange>;
    viewConfig: HexViewerConfig;
}

const styles: Array<CSSProperties> = [
    {height: "1em", zIndex: -1, backgroundColor: "#fcc"},
    {height: "1em", zIndex: -1, backgroundColor: "#cfc"},
    {height: "1em", zIndex: -1, backgroundColor: "#ccf"},
    {borderWidth: "2px", borderBottomStyle: "solid", borderColor: "red"},
    {borderWidth: "2px", borderBottomStyle: "solid", borderColor: "green"},
    {borderWidth: "2px", borderBottomStyle: "solid", borderColor: "blue"},
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
                const style = styles[this.nextStyle++ % styles.length];
                const newMark: HighlightRange = {...this.state.selection, style: style, key: key};
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
        } else if (this.state.data) {
            return (
                <div
                    onKeyPress={e => this.onKeyPress(e)}
                    style={{display: "flex", flexDirection: "column", height: "100%", alignContent: "stretch"}}
                >
                    <div style={{flex: 1, minHeight: 0, display: "flex"}}>
                        <div style={{flex: 1, minWidth: 0}}>
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
