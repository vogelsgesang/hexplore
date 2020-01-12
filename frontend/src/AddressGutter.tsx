import React from 'react'
import "./AddressGutter.css"

interface AddressGutterProps {
    startOffset: number;
    endOffset: number;
    lineWidth: number;
}

export function AddressGutter(props : AddressGutterProps) {
    let lines = [];
    for (let i = props.startOffset; i < props.endOffset; i += props.lineWidth) {
        lines.push(<div key={i} className="address">{"0x"+i.toString(16)}</div>);
    }
    return <div className="address-gutter">{lines}</div>;
}