import React, { useState } from "react";
import ReactDOM from "react-dom";
import { DataGrid } from "./DataGrid"

class App extends React.Component<any, any> {
    state = {
        cursorPosition: 0,
        selection: {from: 0, to: 1},
    }

    render() {
        return (
            <div>
                <DataGrid data={this.props.data}
                    cursorPosition={this.state.cursorPosition} setCursorPosition={(x) => this.setState({cursorPosition: x})}
                    selection={this.state.selection} setSelection={(x) => this.setState({selection: x})}/>
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