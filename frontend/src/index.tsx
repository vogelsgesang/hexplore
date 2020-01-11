import React, { KeyboardEvent, CSSProperties } from "react";
import ReactDOM from "react-dom";
import { DataGrid, HighlightRange, Range } from "./DataGrid"

interface AppState {
    cursorPosition : number;
    selection : Range;
    highlighted : Array<HighlightRange>;
}

const styles : Array<CSSProperties> = [
    {height: "1em", zIndex: -1, backgroundColor: "#fcc"},
    {height: "1em", zIndex: -1, backgroundColor: "#cfc"},
    {height: "1em", zIndex: -1, backgroundColor: "#ccf"},
    {marginTop: "1.1em", borderWidth:"3px", borderBottomStyle: "solid", borderColor: "red"},
    {marginTop: "1.1em", borderWidth:"3px", borderBottomStyle: "solid", borderColor: "green"},
    {marginTop: "1.1em", borderWidth:"3px", borderBottomStyle: "solid", borderColor: "blue"},
];

class App extends React.Component<any, AppState> {
    state = {
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
        let markList = this.state.highlighted.map((e) => <div>{e.from} - {e.to}</div>);
        return (
            <div onKeyPress={(e) => this.onKeyPress(e)}>
                <DataGrid data={this.props.data}
                    cursorPosition={this.state.cursorPosition} setCursorPosition={(x) => this.setState({cursorPosition: x})}
                    selection={this.state.selection} setSelection={(x) => this.setState({selection: x})}
                    highlightRanges={this.state.highlighted}/>
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