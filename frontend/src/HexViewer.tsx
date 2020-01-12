import React, { CSSProperties } from "react";
import { DataGrid, HighlightRange, Range, byteAsAscii, byteAsHex } from "./DataGrid"
import { AddressGutter } from "./AddressGutter"

export interface HexViewerProps {
    data : ArrayBuffer;
    lineWidth? : number;
    highlightRanges? : HighlightRange[];
    cursorPosition : number;
    setCursorPosition? : (pos:number)=>void;
    selection? : Range;
    setSelection? : (r:Range)=>void;
    style? : CSSProperties;
    className? : string;
}

export function HexViewer(props : HexViewerProps) {
    const lineWidth = props.lineWidth ?? 16;
    const length = props.data.byteLength;
    return (
        <div className={props.className} style={{...props.style, overflow: "auto"}}>
            <div style={{display: "flex", flex: 1}}>
                <div style={{flexShrink: 1}}>
                    <AddressGutter stepSize={lineWidth} end={length}/>
                </div>
                <div style={{borderLeft: "1px solid red", margin: "0 .1em"}}/>
                <div style={{flexShrink: 1}}>
                    <DataGrid data={props.data} renderer={byteAsHex}
                        lineWidth={lineWidth}
                        className="spaced"
                        cursorPosition={props.cursorPosition} setCursorPosition={props.setCursorPosition}
                        selection={props.selection} setSelection={props.setSelection}
                        highlightRanges={props.highlightRanges}/>
                </div>
                <div style={{borderLeft: "1px solid red", margin: "0 .1em"}}/>
                <div style={{flexShrink: 1}}>
                    <DataGrid data={props.data} renderer={byteAsAscii}
                        cursorPosition={props.cursorPosition} setCursorPosition={props.setCursorPosition}
                        lineWidth={lineWidth}
                        selection={props.selection} setSelection={props.setSelection}
                        highlightRanges={props.highlightRanges}/>
                </div>
            </div>
        </div>
    );
}