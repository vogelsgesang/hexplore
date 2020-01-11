import React, { useState } from "react";
import "./DataGrid.css"

function byteAsHex(a:number) {
    const table = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    return table[Math.floor(a/16)] + table[a%16];
}

export function DataGrid({data} : { data: ArrayBuffer}) {
    const width = 20;
    const view = new Int8Array(data);

    const [position, setPosition] = useState(0);
    // Event handlers influencing the current position
    const clickOctet = (e:React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
        setPosition(parseInt(e.currentTarget.dataset.idx as string) || 0);
    }
    const keyPress = (e:React.KeyboardEvent<HTMLDivElement>) => {
        let newPosition = position;
        switch (e.key) {
            case "ArrowLeft": setPosition(Math.max(position - 1, 0)); break;
            case "ArrowRight": setPosition(Math.min(position + 1, view.length - 1)); break;
            case "ArrowUp": setPosition((position >= width) ? (position - width) : position); break;
            case "ArrowDown": setPosition((position < view.length - width) ? (position + width) : position); break;
        }
    }

    // Render the grid
    let lines = [];
    for (let idx = 0; idx < view.length; ) {
        const limit = Math.min(view.length, idx + width);
        let line = [];
        for (; idx < limit; ++idx) {
            let className = "octet " + (idx == position ? "cursor" : "");
            line.push(<span key={idx} className={className} data-idx={idx} onClick={clickOctet}><span>{byteAsHex(view[idx])}</span></span>);
        }
        lines.push(<div key={idx}>{line}</div>);
    }
    return <div className="hexgrid">{lines}</div>
}