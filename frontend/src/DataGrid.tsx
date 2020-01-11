import React, { useState } from "react";
import "./DataGrid.css"

function byteAsHex(a:number) {
    const table = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    return table[Math.floor(a/16)] + table[a%16];
}

export function DataGrid({data} : { data: ArrayBuffer}) {
    const width = 20;
    const view = new Int8Array(data);
    let lines = [];
    for (let idx = 0; idx < view.length; ) {
        const limit = Math.min(view.length, idx + width);
        let line = [];
        for (; idx < limit; ++idx) {
            line.push(<span className="octet">{byteAsHex(view[idx])}</span>);
        }
        lines.push(<div>{line}</div>);
    }
    return <div className="hexgrid">{lines}</div>
}