import React from "react";
import ReactDOM from "react-dom";
import { DataGrid } from "./DataGrid"

class App extends React.Component<any, {}> {
    render() {
        return <DataGrid data={this.props.data}></DataGrid>;
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