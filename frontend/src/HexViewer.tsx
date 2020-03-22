import {assert, assertUnreachable as assertExhausted} from "./util";
import React, {useRef, useState, useEffect, useLayoutEffect, RefObject, useMemo, useCallback} from "react";
import ResizeObserver from "resize-observer-polyfill";
import {DataGrid, HighlightRange, Range} from "./DataGrid";
import {
    HexViewerConfig,
    ColumnType,
    AddressGutterConfig,
    IntegerColumnConfig,
    IntegerDisplayMode,
    ColumnConfig,
    AddressDisplayMode,
} from "./HexViewerConfig";
import memoize from "fast-memoize";
import "./HexViewer.css";

interface Vector2 {
    x: number;
    y: number;
}

function useScrollAware<T extends HTMLElement>(prevRef?: RefObject<T>): [Vector2, RefObject<T>] {
    const ref = prevRef ?? useRef<T>(null);
    const [scrollPos, setScrollPos] = useState<Vector2>({x: 0, y: 0});

    function onScroll(e: Event) {
        setScrollPos({x: (e.target as T).scrollLeft, y: (e.target as T).scrollTop});
    }

    useEffect(() => {
        const scrollElem = ref.current;
        assert(scrollElem);
        setScrollPos({x: scrollElem.scrollLeft, y: scrollElem.scrollTop});
        scrollElem.addEventListener("scroll", onScroll);
        return () => scrollElem.removeEventListener("scroll", onScroll);
    }, [ref.current]);

    return [scrollPos, ref];
}

function useSizeAware<T extends HTMLElement>(prevRef?: RefObject<T>): [Vector2, RefObject<T>] {
    const ref = prevRef ?? useRef<T>(null);
    const [size, setSize] = useState<Vector2>({x: 0, y: 0});

    useLayoutEffect(() => {
        const elem = ref.current;
        assert(elem);
        const ro = new ResizeObserver(entries => {
            assert(entries.length === 1);
            const entry = entries[0];
            const {width, height} = entry.contentRect;
            setSize({x: width, y: height});
        });
        const {width, height} = elem.getBoundingClientRect();
        setSize({x: width, y: height});
        ro.observe(elem);
        return () => ro.disconnect();
    }, [ref.current]);
    return [size, ref];
}

function byteAsAscii(data: DataView, idx: number) {
    const byte = data.getUint8(idx);
    // prettier-ignore
    const asciiTable = [" ", "!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~"];
    const isPrintable = byte > 0x20 && byte < 127;
    if (isPrintable) {
        return asciiTable[byte - 0x20];
    } else {
        return ".";
    }
}

function formatInteger(v: number, base: number, width: number, signed: boolean) {
    let s = Math.abs(v)
        .toString(base)
        .padStart(width, "0");
    if (signed) {
        s = (v < 0 ? "-" : " ") + s;
    }
    return s;
}

function formatInteger64bit(low: number, high: number, base: number, width: number, signed: boolean) {
    const bit32 = 0x100000000;
    const negative = signed && high & 0x80000000;
    if (negative) {
        high = ~high;
        low = bit32 - low;
    }
    let s = "";
    while (high || low) {
        const mod = (high % base) * bit32 + low;
        high = Math.floor(high / base);
        low = Math.floor(mod / base);
        s = (mod % base).toString(base) + s;
    }
    s = s.padStart(width, "0");
    if (signed) {
        s = (negative ? "-" : " ") + s;
    }
    return s;
}

function getIntegerStrWidth(width: 1 | 2 | 4 | 8, display: IntegerDisplayMode) {
    let base: number;
    switch (display) {
        case IntegerDisplayMode.Binary:
            base = 2;
            break;
        case IntegerDisplayMode.Octal:
            base = 8;
            break;
        case IntegerDisplayMode.Decimal:
            base = 10;
            break;
        case IntegerDisplayMode.Hexadecimal:
            base = 16;
            break;
    }
    return Math.ceil((Math.log(1 << 8) / Math.log(base)) * width);
}

const createIntegerRenderer = memoize(function createIntegerRenderer(
    width: 1 | 2 | 4 | 8,
    signed: boolean,
    littleEndian: boolean,
    display: IntegerDisplayMode,
) {
    // TODO: deduplicate with getIntegerStrWidth
    let base: number;
    switch (display) {
        case IntegerDisplayMode.Binary:
            base = 2;
            break;
        case IntegerDisplayMode.Octal:
            base = 8;
            break;
        case IntegerDisplayMode.Decimal:
            base = 10;
            break;
        case IntegerDisplayMode.Hexadecimal:
            base = 16;
            break;
    }
    const strWidth = Math.ceil((Math.log(1 << 8) / Math.log(base)) * width);

    return function intRenderer(data: DataView, idx: number): string {
        idx *= width;
        if (idx + width > data.byteLength) {
            return ".".repeat((signed ? 1 : 0) + strWidth);
        }
        if (width == 1) {
            const v = signed ? data.getInt8(idx) : data.getUint8(idx);
            return formatInteger(v, base, strWidth, signed);
        } else if (width == 2) {
            const v = signed ? data.getInt16(idx, littleEndian) : data.getUint16(idx, littleEndian);
            return formatInteger(v, base, strWidth, signed);
        } else if (width == 4) {
            const v = signed ? data.getInt32(idx, littleEndian) : data.getUint32(idx, littleEndian);
            return formatInteger(v, base, strWidth, signed);
        } else if (width == 8) {
            let low, high;
            if (littleEndian) {
                low = data.getUint32(idx, true);
                high = data.getUint32(idx + 4, true);
            } else {
                low = data.getUint32(idx + 4, false);
                high = data.getUint32(idx, false);
            }
            return formatInteger64bit(low, high, base, strWidth, signed);
        }
        assertExhausted(width);
    };
});

const createAddressGutterRenderer = memoize(function createIntegerRenderer(
    mode: AddressDisplayMode,
    lineWidth: number,
) {
    return function addressRenderer(_data: DataView, idx: number): string {
        const addr = idx * lineWidth;
        switch (mode) {
            case AddressDisplayMode.Decimal: {
                return addr.toString(10);
            }
            case AddressDisplayMode.Hexadecimal: {
                return "0x" + addr.toString(16);
            }
        }
    };
});

interface HexViewerColumnProps {
    dataView: DataView;
    columnConfig: ColumnConfig;
    lineWidth: number;
    charWidth: number;
    cellHeight: number;
    cellPaddingY: number;
    firstRenderedLine: number;
    lastRenderedLine: number;
    highlightRanges?: HighlightRange[];
    cursorPosition: number;
    setCursorPosition?: (pos: number) => void;
    selection?: Range;
    setSelection?: (r: Range) => void;
}

function HexViewerColumn({
    dataView,
    columnConfig,
    lineWidth,
    firstRenderedLine,
    lastRenderedLine,
    charWidth,
    cellHeight,
    cellPaddingY,
    highlightRanges,
    cursorPosition,
    setCursorPosition,
    selection,
    setSelection,
}: HexViewerColumnProps) {
    const byteLength = dataView.byteLength;
    let elementWidth: number;
    let cellWidth: number;
    let cellPaddingX: number;
    switch (columnConfig.columnType) {
        case ColumnType.AddressGutter:
            elementWidth = lineWidth;
            cellWidth = 10 * charWidth;
            cellPaddingX = 0;
            break;
        case ColumnType.AsciiColumn:
            elementWidth = 1;
            cellWidth = charWidth;
            cellPaddingX = 0;
            break;
        case ColumnType.IntegerColumn: {
            const cc = columnConfig as IntegerColumnConfig;
            elementWidth = cc.width;
            cellWidth = (getIntegerStrWidth(cc.width, cc.displayMode) + (cc.signed ? 1 : 0)) * charWidth;
            cellPaddingX = 0.8 * charWidth;
            break;
        }
        default:
            assertExhausted(columnConfig.columnType);
    }

    const gridProps = {
        data: dataView,
        overallLength: Math.ceil(byteLength) / elementWidth,
        cellWidth: cellWidth,
        cellHeight: cellHeight,
        cellPaddingX: cellPaddingX,
        cellPaddingY: cellPaddingY,
        lineWidth: lineWidth / elementWidth,
        renderLineStart: firstRenderedLine,
        renderLineLimit: lastRenderedLine + 1, // TODO: pass line limits consitently
        cursorPosition: Math.floor(cursorPosition / elementWidth),
        setCursorPosition: useCallback(e => (setCursorPosition ? setCursorPosition(e * elementWidth) : undefined), [
            elementWidth,
        ]),
        selection: selection
            ? {from: Math.floor(selection.from / elementWidth), to: Math.ceil(selection.to / elementWidth)}
            : undefined,
        setSelection: useCallback(
            (s: Range) =>
                setSelection ? setSelection({from: s.from * elementWidth, to: s.to * elementWidth}) : undefined,
            [setSelection, elementWidth],
        ),
        highlightRanges: useMemo(
            () =>
                highlightRanges?.map(h => {
                    return {...h, from: Math.floor(h.from / elementWidth), to: Math.ceil(h.to / elementWidth)};
                }),
            [highlightRanges, elementWidth],
        ),
    };
    switch (columnConfig.columnType) {
        case ColumnType.AddressGutter: {
            const cc = columnConfig as AddressGutterConfig;
            return <DataGrid {...gridProps} renderer={createAddressGutterRenderer(cc.displayMode, lineWidth)} />;
        }
        case ColumnType.AsciiColumn: {
            return <DataGrid {...gridProps} renderer={byteAsAscii} />;
        }
        case ColumnType.IntegerColumn: {
            const cc = columnConfig as IntegerColumnConfig;
            const renderer = createIntegerRenderer(cc.width, cc.signed, cc.littleEndian, cc.displayMode);
            return <DataGrid {...gridProps} renderer={renderer} />;
        }
        default:
            assertExhausted(columnConfig.columnType);
    }
}

export interface HexViewerProps {
    data: ArrayBuffer;
    viewConfig: HexViewerConfig;
    highlightRanges?: HighlightRange[];
    cursorPosition: number;
    setCursorPosition?: (pos: number) => void;
    selection?: Range;
    setSelection?: (r: Range) => void;
}

export function HexViewer(props: HexViewerProps) {
    const viewConfig = props.viewConfig;
    const lineWidth = viewConfig.lineWidth;
    const byteLength = props.data.byteLength;
    const [scrollPos, ref1] = useScrollAware<HTMLDivElement>();
    const [size, ref] = useSizeAware<HTMLDivElement>(ref1);
    const [textSize, textMeasureRef] = useSizeAware<HTMLDivElement>();

    const cellHeight = textSize.y;
    const cellPaddingY = 0.05 * cellHeight;

    const listLength = Math.ceil(byteLength / lineWidth);
    const viewportHeight = size.y;
    const elementHeight = cellHeight + cellPaddingY;
    const paddingSize = 0.5 * viewportHeight;
    const scrollY = scrollPos.y;
    const firstRenderedLine = Math.max(Math.floor((scrollY - paddingSize) / elementHeight), 0);
    const lastRenderedLine = Math.min(Math.ceil((scrollY + viewportHeight + paddingSize) / elementHeight), listLength);

    const dataView = useMemo(() => new DataView(props.data), []);

    const renderedContent = [];
    for (let columnIdx = 0; columnIdx < viewConfig.columns.length; ++columnIdx) {
        const columnConfig = viewConfig.columns[columnIdx];
        renderedContent.push(
            <div key={"c" + columnIdx} className="hex-viewer-column">
                <HexViewerColumn
                    dataView={dataView}
                    columnConfig={columnConfig}
                    lineWidth={lineWidth}
                    firstRenderedLine={firstRenderedLine}
                    lastRenderedLine={lastRenderedLine}
                    charWidth={textSize.x}
                    cellHeight={cellHeight}
                    cellPaddingY={cellPaddingY}
                    highlightRanges={props.highlightRanges}
                    cursorPosition={props.cursorPosition}
                    setCursorPosition={props.setCursorPosition}
                    selection={props.selection}
                    setSelection={props.setSelection}
                />
            </div>,
        );
    }

    return (
        <div style={{width: "100%", height: "100%", overflow: "auto"}} ref={ref}>
            <div className="hex-viewer">
                <div className="measure-text" ref={textMeasureRef}>
                    0
                </div>
                {renderedContent}
            </div>
        </div>
    );
}
