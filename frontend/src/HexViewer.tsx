import {assert, assertUnreachable as assertExhausted} from "./util";
import React, {
    useRef,
    useState,
    useEffect,
    useLayoutEffect,
    CSSProperties,
    RefObject,
    useMemo,
    useCallback,
} from "react";
import ResizeObserver from "resize-observer-polyfill";
import {DataGrid, HighlightRange, Range} from "./DataGrid";
import {AddressGutter} from "./AddressGutter";
import {
    HexViewerConfig,
    ColumnType,
    AddressGutterConfig,
    IntegerColumnConfig,
    IntegerDisplayMode,
    ColumnConfig,
} from "./HexViewerConfig";
import memoize from "fast-memoize";

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
    debugger;
    console.log(high, low);
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

const createIntegerRenderer = memoize(function createIntegerRenderer(
    width: 1 | 2 | 4 | 8,
    signed: boolean,
    littleEndian: boolean,
    display: IntegerDisplayMode,
) {
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

interface HexViewerColumnProps {
    dataView: DataView;
    columnConfig: ColumnConfig;
    lineWidth: number;
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
    highlightRanges,
    cursorPosition,
    setCursorPosition,
    selection,
    setSelection,
}: HexViewerColumnProps) {
    const byteLength = dataView.byteLength;
    let elementWidth: number;
    switch (columnConfig.columnType) {
        case ColumnType.AddressGutter:
            elementWidth = 1;
            break;
        case ColumnType.AsciiColumn:
            elementWidth = 1;
            break;
        case ColumnType.IntegerColumn: {
            const cc = columnConfig as IntegerColumnConfig;
            elementWidth = cc.width;
            break;
        }
        default:
            assertExhausted(columnConfig.columnType);
    }

    const scrollRelatedProps = {
        startOffset: (firstRenderedLine * lineWidth) / elementWidth,
        endOffset: Math.ceil(Math.min(lastRenderedLine * lineWidth, byteLength) / elementWidth),
        lineWidth: lineWidth / elementWidth,
    };
    const gridProps = {
        ...scrollRelatedProps,
        data: dataView,
        overallLength: Math.ceil(byteLength) / elementWidth,
        cursorPosition: Math.floor(cursorPosition / elementWidth),
        setCursorPosition: useCallback(e => (setCursorPosition ? setCursorPosition(e * elementWidth) : undefined), [
            elementWidth,
        ]),
        selection: useMemo(
            () =>
                selection
                    ? {from: Math.floor(selection.from / elementWidth), to: Math.ceil(selection.to / elementWidth)}
                    : undefined,
            [selection, elementWidth],
        ),
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
            return (
                <AddressGutter
                    {...scrollRelatedProps}
                    offset={cc.offset}
                    paddingWidth={cc.paddingWidth}
                    displayMode={cc.displayMode}
                />
            );
        }
        case ColumnType.AsciiColumn: {
            return <DataGrid {...gridProps} renderer={byteAsAscii} />;
        }
        case ColumnType.IntegerColumn: {
            const cc = columnConfig as IntegerColumnConfig;
            const renderer = createIntegerRenderer(cc.width, cc.signed, cc.littleEndian, cc.displayMode);
            return <DataGrid {...gridProps} renderer={renderer} className="spaced" />;
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
    style?: CSSProperties;
    className?: string;
}

export function HexViewer(props: HexViewerProps) {
    const viewConfig = props.viewConfig;
    const lineWidth = viewConfig.lineWidth;
    const byteLength = props.data.byteLength;
    const [scrollPos, ref1] = useScrollAware<HTMLDivElement>();
    const [size, ref] = useSizeAware<HTMLDivElement>(ref1);

    const listLength = Math.ceil(byteLength / lineWidth);
    const viewportHeight = size.y;
    const elementHeight = 17.6; // TODO: read from element/CSS?
    const paddingSize = 100;
    const scrollY = scrollPos.y;
    const listHeight = listLength * elementHeight;
    const firstRenderedLine = Math.max(Math.floor((scrollY - paddingSize) / elementHeight), 0);
    const lastRenderedLine = Math.min(Math.ceil((scrollY + viewportHeight + paddingSize) / elementHeight), listLength);

    const dataView = useMemo(() => new DataView(props.data), []);

    const renderedContent = [];
    for (let columnIdx = 0; columnIdx < viewConfig.columns.length; ++columnIdx) {
        const columnConfig = viewConfig.columns[columnIdx];
        renderedContent.push(
            <div key={"c" + columnIdx} style={{flexShrink: 1, height: listHeight, margin: ".5em"}}>
                <div style={{transform: `translateY(${firstRenderedLine * elementHeight}px)`}}>
                    <HexViewerColumn
                        dataView={dataView}
                        columnConfig={columnConfig}
                        lineWidth={lineWidth}
                        firstRenderedLine={firstRenderedLine}
                        lastRenderedLine={lastRenderedLine}
                        highlightRanges={props.highlightRanges}
                        cursorPosition={props.cursorPosition}
                        setCursorPosition={props.setCursorPosition}
                        selection={props.selection}
                        setSelection={props.setSelection}
                    />
                </div>
            </div>,
        );
        if (columnIdx < viewConfig.columns.length - 1) {
            renderedContent.push(<div key={"s" + columnIdx} style={{borderLeft: "1px solid red", margin: "0 .1em"}} />);
        }
    }

    return (
        <div className={props.className} style={{...props.style, overflow: "auto"}} ref={ref}>
            <div style={{display: "flex"}}>{renderedContent}</div>
        </div>
    );
}
