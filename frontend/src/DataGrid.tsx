import React, {useState, CSSProperties} from "react";
import "./DataGrid.css";

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
    // Rendered part (for virtual scrolling)
    renderLineStart: number;
    renderLineLimit: number;
    // Navigation and selection
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

export function DataGrid<T>(props: DataGridProperties<T>) {
    const data = props.data;
    const renderer = props.renderer;
    const lineWidth = props.lineWidth;
    const overallLength = props.overallLength;
    let highlightRanges = props.highlightRanges ?? [];
    const cursorPosition = props.cursorPosition;
    const setCursorPosition = props.setCursorPosition ?? ((_: number) => {});
    const selection = props.selection;
    const setSelectionRaw = props.setSelection ?? ((_: Range) => {});

    // Render the cursor and the selection like all other highlight ranges
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

    // Event handlers influencing the current position
    const [selectionGestureStart, setSelectionGestureStart] = useState(0);
    const setSelection = (a: number, b: number) => {
        if (a < b) setSelectionRaw({from: a, to: b + 1});
        else setSelectionRaw({from: b, to: a + 1});
    };
    const updateCursorPosition = (pos: number, select: boolean) => {
        setCursorPosition(pos);
        if (select) {
            setSelection(selectionGestureStart, pos);
        } else {
            setSelectionGestureStart(pos);
            setSelection(pos, pos);
        }
    };
    const clickElement = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        let el: HTMLElement | null = e.target as HTMLElement;
        while (el.dataset.idx === undefined && !el.classList.contains("data-grid") && (el = el.parentElement));
        if (el !== null && el.dataset.idx) {
            updateCursorPosition(parseInt(el.dataset.idx as string), e.shiftKey);
        }
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
    const lineLimit = Math.min(props.renderLineLimit, overallLength);
    for (let lineNr = props.renderLineStart; lineNr < lineLimit; ++lineNr) {
        const cellStart = lineNr * lineWidth;
        const cellLimit = Math.min(cellStart + lineWidth, overallLength);
        const positionTop = lineNr * (props.cellHeight + props.cellPaddingY);
        // Render the actual content
        const cells = [];
        for (let idx = cellStart; idx < cellLimit; ++idx) {
            const cellNr = idx - cellStart;
            const positionLeft = cellNr * (props.cellWidth + props.cellPaddingX);
            cells.push(
                <span
                    key={idx}
                    style={{position: "absolute", top: `${positionTop}px`, left: `${positionLeft}px`}}
                    data-idx={idx}
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
                    left: `${localFrom * (props.cellWidth + props.cellPaddingX)}px`,
                    width: `${computeSizeWithPadding(localTo - localFrom, props.cellWidth, props.cellPaddingX)}px`,
                    height: props.cellHeight,
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

    const wrapperStyle = {
        height: `${computeSizeWithPadding(
            Math.ceil(overallLength / lineWidth),
            props.cellHeight,
            props.cellPaddingY,
        )}px`,
        width: `${computeSizeWithPadding(lineWidth, props.cellWidth, props.cellPaddingX)}px`,
    };

    return (
        <div className="data-grid" style={wrapperStyle} tabIndex={0} onKeyDown={keyPress} onClick={clickElement}>
            {lines}
        </div>
    );
}
