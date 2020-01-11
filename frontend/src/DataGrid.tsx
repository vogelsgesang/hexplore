import React, { useState, CSSProperties, useEffect, useLayoutEffect, useRef } from "react";
import "./DataGrid.css"
import { assert } from "./util";

function byteAsHex(a:number) {
    const table = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    return table[Math.floor(a/16)] + table[a%16];
}

interface HighlightRange {
    from: number,
    to: number,
    key: string,
    className?: string;
    style?: CSSProperties,
}

export function DataGrid({data} : { data: ArrayBuffer}) {
    const linewidth = 20;
    const highlightRanges : HighlightRange[] = [
        {from: 0, to: 20, style:{marginTop: "1.1em", borderBottom:"1px dotted red"}, key: "range0"},
        {from: 17, to: 23, style:{background: "red", marginTop: "1em", height:"1px"}, key: "range1"},
        {from: 49, to: 64, style:{background: "#ccc", height:"1em", zIndex: -1}, key: "range2"},
    ];
    const view = new Int8Array(data);

    const [position, setPosition] = useState(0);
    // Event handlers influencing the current position
    const clickOctet = (e:React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
        setPosition(parseInt(e.currentTarget.dataset.idx as string) || 0);
    }
    const keyPress = (e:React.KeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
            case "ArrowLeft": setPosition(Math.max(position - 1, 0)); break;
            case "ArrowRight": setPosition(Math.min(position + 1, view.length - 1)); break;
            case "ArrowUp": setPosition((position >= linewidth) ? (position - linewidth) : position); break;
            case "ArrowDown": setPosition((position < view.length - linewidth) ? (position + linewidth) : position); break;
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
            let className = "octet " + (idx == position ? "cursor" : "");
            line.push(<span key={"o"+idx} className={className} data-idx={idx} onClick={clickOctet}><span>{byteAsHex(view[idx])}</span></span>);
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
    return  (
        <div className="hexgrid" tabIndex={0} onKeyDown={keyPress} ref={gridRef}>
            {lines}
        </div>
    );
}