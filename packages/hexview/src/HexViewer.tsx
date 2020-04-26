import {assertUnreachable as assertExhausted} from "./util";
import React, {useRef, useState, useMemo, useCallback} from "react";
import {useVirtualScroll, useSizeAware} from './RepresentationHooks'
import {
    RendererConfig,
    createAddressRendererConfig,
    createIntegerRendererConfig,
    createAsciiRendererConfig,
    RendererType,
    IntegerRendererConfig,
} from "./ByteRenderer";
import {DataGrid, HighlightRange, Range} from "./DataGrid";
import {createStridedRenderer} from "./ByteRenderer";

export interface HexViewerConfig {
    lineWidth: number;
    columns: RendererConfig[];
}

export const defaultConfig: HexViewerConfig = {
    lineWidth: 16,
    columns: [createAddressRendererConfig(), createIntegerRendererConfig(), createAsciiRendererConfig()],
};

interface HexViewerColumnProps {
    dataView: DataView;
    columnConfig: RendererConfig;
    lineWidth: number;
    charWidth: number;
    cellHeight: number;
    cellPaddingY: number;
    renderLineStart: number;
    renderLineLimit: number;
    highlightRanges: HighlightRange[];
    setHoverRange?: (pos: Range | undefined) => void;
    cursorPosition: number;
    setCursorPosition?: (pos: number) => void;
    selection?: Range;
    setSelection?: (r: Range) => void;
}

const HexViewerColumn = React.memo(function HexViewerColumn({
    dataView,
    columnConfig,
    lineWidth,
    renderLineStart,
    renderLineLimit,
    charWidth,
    cellHeight,
    cellPaddingY,
    highlightRanges,
    setHoverRange,
    cursorPosition,
    setCursorPosition,
    selection,
    setSelection,
}: HexViewerColumnProps) {
    const byteLength = dataView.byteLength;
    let elementWidth: number;
    let cellWidth: number;
    let cellPaddingX: number;
    switch (columnConfig.rendererType) {
        case RendererType.Address:
            elementWidth = lineWidth;
            cellWidth = 10 * charWidth;
            cellPaddingX = 0;
            break;
        case RendererType.Ascii:
            elementWidth = 1;
            cellWidth = charWidth;
            cellPaddingX = 0;
            break;
        case RendererType.Integer: {
            const cc = columnConfig as IntegerRendererConfig;
            elementWidth = cc.width;
            let strLen = Math.ceil((Math.log(1 << 8) / Math.log(cc.displayBase)) * cc.width);
            strLen += cc.signed ? 1 : 0;
            cellWidth = strLen * charWidth;
            cellPaddingX = 0.8 * charWidth;
            break;
        }
        default:
            assertExhausted(columnConfig.rendererType);
    }

    const gridProps = {
        data: dataView,
        overallLength: Math.ceil(byteLength / elementWidth),
        renderer: useMemo(() => createStridedRenderer(columnConfig, elementWidth), [columnConfig, elementWidth]),
        cellWidth: cellWidth,
        cellHeight: cellHeight,
        cellPaddingX: cellPaddingX,
        cellPaddingY: cellPaddingY,
        lineWidth: lineWidth / elementWidth,
        renderLineStart: renderLineStart,
        renderLineLimit: renderLineLimit,
        cursorPosition: Math.floor(cursorPosition / elementWidth),
        setHoverPosition: useCallback(
            e =>
                setHoverRange
                    ? setHoverRange(e !== undefined ? {from: e * elementWidth, to: (e + 1) * elementWidth} : undefined)
                    : undefined,
            [setHoverRange, elementWidth],
        ),
        setCursorPosition: useCallback(e => (setCursorPosition ? setCursorPosition(e * elementWidth) : undefined), [
            setCursorPosition,
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
    return <DataGrid {...gridProps} />;
});

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

    const textMeasureRef = useRef(null);
    const textSize = useSizeAware(textMeasureRef);
    const cellHeight = textSize.y;
    const cellPaddingY = 0.05 * cellHeight;

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const {lineStart, lineLimit} = useVirtualScroll(scrollAreaRef, {
        elementSize: cellHeight + cellPaddingY,
        elementCount: Math.ceil(byteLength / lineWidth),
    });

    const dataView = useMemo(() => new DataView(props.data), [props.data]);

    const [hoverRange, setHoverRange] = useState<Range | undefined>(undefined);
    const hoverFrom = hoverRange?.from;
    const hoverTo = hoverRange?.to;
    const highlightRanges = useMemo(() => {
        const r = props.highlightRanges ?? [];
        if (hoverFrom === undefined || hoverTo === undefined) return r;
        return r.concat([{from: hoverFrom, to: hoverTo, key: "hover", className: "hover"}]);
    }, [props.highlightRanges, hoverFrom, hoverTo]);

    const renderedContent = [];
    for (let columnIdx = 0; columnIdx < viewConfig.columns.length; ++columnIdx) {
        const columnConfig = viewConfig.columns[columnIdx];
        renderedContent.push(
            <div key={"c" + columnIdx} className="hex-viewer-column">
                <HexViewerColumn
                    dataView={dataView}
                    columnConfig={columnConfig}
                    lineWidth={lineWidth}
                    renderLineStart={lineStart}
                    renderLineLimit={lineLimit}
                    charWidth={textSize.x}
                    cellHeight={cellHeight}
                    cellPaddingY={cellPaddingY}
                    highlightRanges={highlightRanges}
                    setHoverRange={setHoverRange}
                    cursorPosition={props.cursorPosition}
                    setCursorPosition={props.setCursorPosition}
                    selection={props.selection}
                    setSelection={props.setSelection}
                />
            </div>,
        );
    }

    return (
        <div className="hex-viewer-scroll" ref={scrollAreaRef}>
            <div className="hex-viewer-content">
                <div className="measure-text" ref={textMeasureRef}>
                    0
                </div>
                {renderedContent}
            </div>
        </div>
    );
}
