import React, { KeyboardEvent, CSSProperties } from "react";
import { HighlightRange, Range } from "./DataGrid";
import { HexViewer } from "./HexViewer";
import ReactDOM from "react-dom";
import "./index.css"

interface AppProps {
    data : ArrayBuffer;
}

interface AppState {
    lineWidth : number;
    cursorPosition : number;
    selection : Range;
    highlighted : Array<HighlightRange>;
}

const styles : Array<CSSProperties> = [
    {height: "1em", zIndex: -1, backgroundColor: "#fcc"},
    {height: "1em", zIndex: -1, backgroundColor: "#cfc"},
    {height: "1em", zIndex: -1, backgroundColor: "#ccf"},
    {marginTop: "1.1em", borderWidth:"2px", borderBottomStyle: "solid", borderColor: "red"},
    {marginTop: "1.1em", borderWidth:"2px", borderBottomStyle: "solid", borderColor: "green"},
    {marginTop: "1.1em", borderWidth:"2px", borderBottomStyle: "solid", borderColor: "blue"},
];

function parseIntWithDefault(str : string, defaultValue : number) {
    const parsed = parseInt(str);
    return !isNaN(parsed) ? parsed : defaultValue;
}

function clampRange(val : number, min : number, max : number) {
    return Math.min(max, Math.max(min, val));
}

class App extends React.Component<AppProps, AppState> {
    state = {
        lineWidth: 16,
        cursorPosition: 0,
        selection: {from: 0, to: 1},
        highlighted: new Array<HighlightRange>()
    }
    nextStyle = 0;

    onKeyPress(e : KeyboardEvent<HTMLDivElement>) {
        if ((e.key.toLowerCase() == "m") && !e.ctrlKey && !e.altKey && !e.metaKey) {
            if (!e.shiftKey) {
                // Add mark
                const key = "m" + new Date().getTime();
                const style = styles[this.nextStyle++ % styles.length];
                const newMark : HighlightRange = {...this.state.selection, style: style, key: key};
                const marks = this.state.highlighted.concat([newMark]);
                this.setState({highlighted: marks, selection: {from: this.state.cursorPosition, to: this.state.cursorPosition+1}});
            } else if (e.shiftKey) {
                // Remove mark
                this.setState({highlighted: []});
                this.nextStyle = 0;
            }
        }
    }

    render() {
        return (
            <div onKeyPress={(e) => this.onKeyPress(e)} style={{display: "flex", flexDirection: "column", height: "100%"}}>
                <HexViewer style={{flex: 1}}
                    data={this.props.data}
                    cursorPosition={this.state.cursorPosition} setCursorPosition={(x) => this.setState({cursorPosition: x})}
                    lineWidth={this.state.lineWidth}
                    selection={this.state.selection} setSelection={(x) => this.setState({selection: x})}
                    highlightRanges={this.state.highlighted}/>
                <div style={{flex: 0}}>
                    <span style={{padding: ".2em", display: "inline-block"}}>
                        Width:
                        <input type="text" size={2} value={this.state.lineWidth} onChange={(e) => this.setState({lineWidth: clampRange(parseIntWithDefault(e.target.value, this.state.lineWidth), 1, 128)})}/>
                    </span>
                    <span style={{padding: ".2em", display: "inline-block"}}>position: {this.state.cursorPosition}</span>
                </div>
            </div>
        );
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    const fileName = new URL(window.location.href).searchParams.get("file") ?? "test.data";
    fetch(fileName)
    .then(function(response) {
        if (!response.ok) {
            throw new Error('HTTP error, status = ' + response.status);
        }
        return response.arrayBuffer();
    })
    .then(function(response) {
        const domContainer = document.querySelector('#main');
        ReactDOM.render(<App data={response}/>, domContainer);
    });
});