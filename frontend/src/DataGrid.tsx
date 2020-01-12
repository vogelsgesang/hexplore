import React, { useState, CSSProperties, useLayoutEffect, useRef } from "react";
import "./DataGrid.css"
import { assert } from "./util";

export function byteAsHex(byte:number) {
    const table = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    return table[Math.floor(byte/16)] + table[byte%16];
}

export function byteAsAscii(byte:number) {
    const asciiTable = [' ', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_', '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~'];
    const isPrintable = (byte > 0x20) && (byte < 128);
    if (isPrintable) {
        return asciiTable[byte - 0x20];
    } else {
        return '.';
    }
}

export interface Range {
    from : number;
    to : number;
}

export interface HighlightRange {
    from : number,
    to : number,
    key : string,
    className? : string;
    style? : CSSProperties,
}

interface DataGridProperties {
    data : ArrayBuffer;
    renderer : (x:number) => string;
    highlightRanges? : HighlightRange[];
    cursorPosition : number;
    setCursorPosition? : (pos:number)=>void;
    selection? : Range;
    setSelection? : (r:Range)=>void;
    className? : string;
}

export function DataGrid(props : DataGridProperties) {
    const view = new Int8Array(props.data);
    const renderer = props.renderer;
    const linewidth = 20;
    let highlightRanges = props.highlightRanges ?? [];
    const cursorPosition = props.cursorPosition;
    const setCursorPosition = props.setCursorPosition ?? ((x:number) => {});
    const selection = props.selection;
    const setSelectionRaw = props.setSelection ?? ((x:Range) => {});
    if (selection !== undefined) {
        highlightRanges = highlightRanges.concat([{from: selection.from, to: selection.to, key: "selection", className: "selection"}]);
    }

    // Event handlers influencing the current position
    const [selectionGestureStart, setSelectionGestureStart] = useState(cursorPosition);
    const setSelection = (a : number, b : number) => {
        if (a < b) setSelectionRaw({from: a, to: b+1});
        else setSelectionRaw({from: b, to: a+1});
    }
    const updateCursorPosition = (pos : number, select : boolean) => {
        setCursorPosition(pos);
        if (select) {
            setSelection(selectionGestureStart, pos);
        } else {
            setSelectionGestureStart(pos);
            setSelection(pos, pos);
        }
    }
    const clickElement = (e:React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
        updateCursorPosition(parseInt(e.currentTarget.dataset.idx as string), e.shiftKey);
    }
    const keyPress = (e:React.KeyboardEvent<HTMLDivElement>) => {
        let newPos = undefined;
        switch (e.key) {
            case "ArrowLeft": newPos = Math.max(cursorPosition - 1, 0); break;
            case "ArrowRight": newPos = Math.min(cursorPosition + 1, view.length - 1); break;
            case "ArrowUp": newPos = (cursorPosition >= linewidth) ? (cursorPosition - linewidth) : cursorPosition; break;
            case "ArrowDown": newPos = (cursorPosition < view.length - linewidth) ? (cursorPosition + linewidth) : cursorPosition; break;
        }
        if (newPos !== undefined) {
            updateCursorPosition(newPos, e.shiftKey);
            e.stopPropagation();
            e.preventDefault();
        }
    }

    // Highlights are positioned after rendering the main DOM
    const rangeMarkClass = "range-mark";
    const gridRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        let gridDom = gridRef.current;
        if (gridDom === null) return;
        const marks = gridDom.getElementsByClassName(rangeMarkClass);
        for (var i = 0, len = marks.length; i < len; i = i + 1) {
            const markEl = marks[i] as HTMLElement;
            const lineContainer = markEl.parentElement;
            assert(lineContainer);
            let startEl = lineContainer.children[parseInt(markEl.dataset.from ?? "0")].children[0];
            let endEl = lineContainer.children[parseInt(markEl.dataset.to ?? "0") - 1].children[0];
            const left = startEl.getBoundingClientRect().left - lineContainer.getBoundingClientRect().left;
            const width = endEl.getBoundingClientRect().right - startEl.getBoundingClientRect().left;
            markEl.style.left = left + "px";
            markEl.style.width = width + "px";
        }
    });


    // Render the grid
    let lines = [];
    for (let idx = 0; idx < view.length; ) {
        const lineStart = idx;
        const lineLimit = Math.min(view.length, idx + linewidth);
        let line = [];
        for (; idx < lineLimit; ++idx) {
            let className = "element " + (idx == cursorPosition ? "cursor" : "");
            line.push(<span key={"o"+idx} className={className} data-idx={idx} onClick={clickElement}><span>{renderer(view[idx])}</span></span>);
        }
        let highlightDivs = [];
        for (let h of highlightRanges) {
            if (h.from < lineLimit && h.to > lineStart) {
                let style : CSSProperties = {...h.style, position: "absolute", top: 0, right: undefined, bottom: undefined};
                let localFrom = Math.max(h.from - lineStart, 0);
                let localTo = Math.min(h.to - lineStart , linewidth);
                let className = rangeMarkClass + " " + (h.className ?? "");
                highlightDivs.push(<div key={"r"+h.key} data-from={localFrom} data-to={localTo} className={className} style={style}></div>)
            }
        }
        lines.push(
            <div key={lineStart} style={{position:"relative"}}>
                {line}
                {highlightDivs}
            </div>);
    }
    const className = "data-grid " + (props.className ?? "");
    return  (
        <div className={className} tabIndex={0} onKeyDown={keyPress} ref={gridRef}>
            {lines}
        </div>
    );
}