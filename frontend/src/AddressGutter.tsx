import React from 'react'
import "./AddressGutter.css"
import { AddressDisplayMode } from './HexViewerConfig';

interface AddressGutterProps {
    startOffset: number;
    endOffset: number;
    lineWidth: number;
    offset: number;
    paddingWidth: number;
    displayMode: AddressDisplayMode;
}

function renderAddress(addr : number, mode : AddressDisplayMode, paddingWidth : number) : string {
    switch (mode) {
        case AddressDisplayMode.Decimal: {
            return addr.toString(10).padStart(paddingWidth, "0");
        }
        case AddressDisplayMode.Hexadecimal: {
            return "0x" + addr.toString(16).padStart(paddingWidth, "0");
        }
    }
}

export function AddressGutter({startOffset, endOffset, lineWidth, offset, displayMode, paddingWidth} : AddressGutterProps) {
    let lines = [];
    for (let i = startOffset; i < endOffset; i += lineWidth) {
        const displayedAddress = i + offset;
        lines.push(<div key={i} className="address">{renderAddress(displayedAddress, displayMode, paddingWidth)}</div>);
    }
    return <div className="address-gutter">{lines}</div>;
}