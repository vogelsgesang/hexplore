import React, {CSSProperties, useRef} from "react";
import {assert} from "./util";

export interface Range {
    from: number;
    to: number;
}

export interface HighlightRange {
    from: number;
    to: number;
    key: string;
    className?: string;
    style?: CSSProperties;
}

interface DataGridProperties<T> {
    // Data and how to render it
    data: T;
    overallLength: number;
    renderer: (x: T, idx: number) => string;
    // How many cell per line?
    lineWidth: number;
    // Visual properties of the cells
    cellWidth: number;
    cellHeight: number;
    cellPaddingX: number;
    cellPaddingY: number;
    maxOverallHeight?: number
    viewOffsetY?: number;
    // Rendered part (for virtual scrolling)
    renderLineStart: number;
    renderLineLimit: number;
    // Navigation and selection
    setHoverPosition?: (pos: number | undefined) => void;
    cursorPosition?: number;
    setCursorPosition?: (pos: number) => void;
    selection?: Range;
    setSelection?: (r: Range) => void;
    // Visual decorations
    highlightRanges?: HighlightRange[];
}

function computeSizeWithPadding(cnt: number, elemSize: number, elemPadding: number) {
    return cnt * (elemSize + elemPadding) - elemPadding;
}

export function DataGrid<T>({
    data,
    overallLength,
    renderer,
    lineWidth,
    cellWidth,
    cellHeight,
    cellPaddingX,
    cellPaddingY,
    viewOffsetY = 0,
    maxOverallHeight,
    renderLineStart,
    renderLineLimit,
    setHoverPosition = () => {},
    cursorPosition,
    setCursorPosition = () => {},
    selection,
    setSelection: setSelectionRaw = () => {},
    highlightRanges,
}: DataGridProperties<T>) {
    // Render the cursor and the selection like all other highlight ranges
    if (highlightRanges === undefined) {
        highlightRanges = [];
    }
    if (cursorPosition !== undefined) {
        highlightRanges = highlightRanges.concat([
            {from: cursorPosition, to: cursorPosition + 1, key: "cursor", className: "cursor"},
        ]);
    }
    if (selection !== undefined) {
        highlightRanges = highlightRanges.concat([
            {from: selection.from, to: selection.to, key: "selection", className: "selection"},
        ]);
    }

    // Event handlers influencing the current position & selection
    const mainElem = useRef<HTMLDivElement>(null);
    const selectionGestureStart = useRef(0);
    const setSelection = (a: number, b: number) => {
        if (a < b) setSelectionRaw({from: a, to: b + 1});
        else setSelectionRaw({from: b, to: a + 1});
    };
    const updateCursorPosition = (pos: number, select: boolean) => {
        setCursorPosition(pos);
        if (select) {
            setSelection(selectionGestureStart.current, pos);
        } else {
            selectionGestureStart.current = pos;
            setSelection(pos, pos);
        }
    };
    const getElementIdxFromMouseEvent = (e: React.MouseEvent | MouseEvent) => {
        assert(mainElem.current);
        const rect = mainElem.current.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top + viewOffsetY;
        const idxX = Math.floor(relX / (cellWidth + cellPaddingX));
        const idxY = Math.floor(relY / (cellHeight + cellPaddingY));
        const clampedCol = Math.min(Math.max(idxX, 0), lineWidth);
        return Math.min(Math.max(idxY * lineWidth + clampedCol, 0), overallLength);
    };
    const docMousemove = (e: MouseEvent) => {
        const elemIdx = getElementIdxFromMouseEvent(e);
        updateCursorPosition(Math.min(elemIdx, overallLength - 1), true);
    };
    const docMouseup = (_e: MouseEvent) => {
        document.removeEventListener("mouseup", docMouseup);
        document.removeEventListener("mousemove", docMousemove);
    };
    const mousedown = (e: React.MouseEvent) => {
        const elemIdx = getElementIdxFromMouseEvent(e);
        updateCursorPosition(Math.min(elemIdx, overallLength - 1), e.shiftKey);
        document.addEventListener("mouseup", docMouseup);
        document.addEventListener("mousemove", docMousemove);
    };
    const mousemove = (e: React.MouseEvent) => {
        const elemIdx = getElementIdxFromMouseEvent(e);
        setHoverPosition(elemIdx < overallLength ? elemIdx : undefined);
    };
    const mouseleave = (_e: React.MouseEvent) => {
        setHoverPosition(undefined);
    };
    const keyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (cursorPosition !== undefined) {
            let newPos = undefined;
            switch (e.key) {
                case "ArrowLeft":
                    newPos = Math.max(cursorPosition - 1, 0);
                    break;
                case "ArrowRight":
                    newPos = Math.min(cursorPosition + 1, overallLength - 1);
                    break;
                case "ArrowUp":
                    newPos = cursorPosition >= lineWidth ? cursorPosition - lineWidth : cursorPosition;
                    break;
                case "ArrowDown":
                    newPos = cursorPosition < overallLength - lineWidth ? cursorPosition + lineWidth : cursorPosition;
                    break;
            }
            if (newPos !== undefined) {
                updateCursorPosition(newPos, e.shiftKey);
                e.stopPropagation();
                e.preventDefault();
            }
        }
    };

    // Render the lines
    const lines = [];
    const lineLimit = Math.min(renderLineLimit, overallLength);
    for (let lineNr = renderLineStart; lineNr < lineLimit; ++lineNr) {
        const cellStart = lineNr * lineWidth;
        const cellLimit = Math.min(cellStart + lineWidth, overallLength);
        const positionTop = lineNr * (cellHeight + cellPaddingY) - viewOffsetY;
        // Render the actual content
        const cells = [];
        for (let idx = cellStart; idx < cellLimit; ++idx) {
            const cellNr = idx - cellStart;
            const positionLeft = cellNr * (cellWidth + cellPaddingX);
            cells.push(
                <span
                    className="grid-cell"
                    key={idx}
                    style={{
                        position: "absolute",
                        top: `${positionTop}px`,
                        left: `${positionLeft}px`,
                        width: `${cellWidth}px`,
                    }}
                    data-idx={idx} // TODO: still needed?
                >
                    {renderer(data, idx)}
                </span>,
            );
        }
        // Render the highlights
        const highlightDivs = [];
        for (const h of highlightRanges) {
            if (h.from < cellLimit && h.to > cellStart) {
                const localFrom = Math.max(h.from - cellStart, 0);
                const localTo = Math.min(h.to - cellStart, cellLimit - cellStart);
                const style: CSSProperties = {
                    ...h.style,
                    position: "absolute",
                    top: `${positionTop}px`,
                    left: `${localFrom * (cellWidth + cellPaddingX)}px`,
                    width: `${computeSizeWithPadding(localTo - localFrom, cellWidth, cellPaddingX)}px`,
                    height: cellHeight,
                };
                highlightDivs.push(<div key={"h" + h.key} className={h.className} style={style} />);
            }
        }

        lines.push(
            <React.Fragment key={"l" + cellStart}>
                {cells}
                {highlightDivs}
            </React.Fragment>,
        );
    }

    let height = Math.min(computeSizeWithPadding(Math.ceil(overallLength / lineWidth), cellHeight, cellPaddingY), maxOverallHeight ?? 1e50);
    const wrapperStyle = {
        height: height + "px",
        width: computeSizeWithPadding(lineWidth, cellWidth, cellPaddingX) + "px"
    };

    return (
        <div
            className="data-grid"
            ref={mainElem}
            style={wrapperStyle}
            tabIndex={0}
            onKeyDown={keyPress}
            onMouseDown={mousedown}
            onMouseMove={mousemove}
            onMouseLeave={mouseleave}
        >
            {lines}
        </div>
    );
}
