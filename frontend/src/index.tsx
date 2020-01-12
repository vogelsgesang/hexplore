import React, { KeyboardEvent, CSSProperties } from "react";
import ReactDOM from "react-dom";
import { DataGrid, HighlightRange, Range, byteAsAscii, byteAsHex } from "./DataGrid"
import { AddressGutter } from "./AddressGutter"

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
        let length = this.props.data.byteLength;
        let markList = this.state.highlighted.map((e) => <div>{e.from} - {e.to}</div>);
        return (
            <div onKeyPress={(e) => this.onKeyPress(e)}>
                <div style={{display: "flex"}}>
                    <div style={{flexShrink: 1}}>
                        <AddressGutter stepSize={this.state.lineWidth} end={length}/>
                    </div>
                    <div style={{borderLeft: "1px solid red", margin: "0 .1em"}}/>
                    <div style={{flexShrink: 1}}>
                        <DataGrid data={this.props.data} renderer={byteAsHex}
                            lineWidth={this.state.lineWidth}
                            className="spaced"
                            cursorPosition={this.state.cursorPosition} setCursorPosition={(x) => this.setState({cursorPosition: x})}
                            selection={this.state.selection} setSelection={(x) => this.setState({selection: x})}
                            highlightRanges={this.state.highlighted}/>
                    </div>
                    <div style={{borderLeft: "1px solid red", margin: "0 .1em"}}/>
                    <div style={{flexShrink: 1}}>
                        <DataGrid data={this.props.data} renderer={byteAsAscii}
                            cursorPosition={this.state.cursorPosition} setCursorPosition={(x) => this.setState({cursorPosition: x})}
                            lineWidth={this.state.lineWidth}
                            selection={this.state.selection} setSelection={(x) => this.setState({selection: x})}
                            highlightRanges={this.state.highlighted}/>
                    </div>
                </div>
                Width:
                <input type="text" size={2} value={this.state.lineWidth} onChange={(e) => this.setState({lineWidth: clampRange(parseIntWithDefault(e.target.value, this.state.lineWidth), 1, 128)})}/>
                <div>{markList}</div>
                <div>position: {this.state.cursorPosition}</div>
            </div>
        );
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    fetch('index.html')
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