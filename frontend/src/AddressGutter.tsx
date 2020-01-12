import React from 'react'
import "./AddressGutter.css"

interface AddressGutterProps {
    end: number;
    stepSize: number;
}

export function AddressGutter(props : AddressGutterProps) {
    let lines = [];
    for (let i = 0; i < props.end; i += props.stepSize) {
        lines.push(<div key={i}>{"0x"+i.toString(16)}</div>);
    }
    return <div className="address-gutter">{lines}</div>;
}