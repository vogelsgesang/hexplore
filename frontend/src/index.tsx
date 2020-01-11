import React from "react";
import ReactDOM from "react-dom";

class App extends React.Component<{}, {}> {
    render() {
        return <h1>Hello World</h1>
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    const domContainer = document.querySelector('#main');
    ReactDOM.render(<App/>, domContainer);
});