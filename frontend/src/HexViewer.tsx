import React, { useRef, useState, useEffect, useLayoutEffect, CSSProperties, Ref, RefObject, useMemo } from "react";
import ResizeObserver from 'resize-observer-polyfill';
import { DataGrid, HighlightRange, Range, byteAsAscii, byteAsHex } from "./DataGrid"
import { AddressGutter } from "./AddressGutter"
import { assert } from "./util";

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

interface Vector2 {
    x : number;
    y : number;
}

function useScrollAware<T extends HTMLElement>(prevRef? : RefObject<T>) : [Vector2, RefObject<T>] {
    const ref = prevRef ?? useRef<T>(null);
    const [scrollPos, setScrollPos] = useState<Vector2>({x: 0, y: 0});

    function onScroll(e : Event) {
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

function useSizeAware<T extends HTMLElement>(prevRef? : RefObject<T>) : [Vector2, RefObject<T>] {
    const ref = prevRef ?? useRef<T>(null);
    const [size, setSize] = useState<Vector2>({x: 0, y: 0});

    useLayoutEffect(() => {
        const elem = ref.current;
        assert(elem);
        const ro = new ResizeObserver((entries, _) => {
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

export function HexViewer(props : HexViewerProps) {
    const lineWidth = props.lineWidth ?? 16;
    const byteLength = props.data.byteLength;
    const [scrollPos, ref1] = useScrollAware<HTMLDivElement>();
    const [size, ref] = useSizeAware<HTMLDivElement>(ref1);

    const listLength = Math.ceil(byteLength / lineWidth);
    const viewportHeight = size.y;
    const elementHeight = 17.6; // TODO: read from element/CSS?
    const paddingSize = 100;
    const scrollY = scrollPos.y;
    const listHeight = listLength*elementHeight;
    const firstRenderedIdx = Math.max(Math.floor((scrollY - paddingSize) / elementHeight), 0);
    const lastRenderedIdx = Math.min(Math.ceil((scrollY + viewportHeight + paddingSize) / elementHeight), listLength);

    const dataView = useMemo(() => new Uint8Array(props.data), []);

    const scrollRelatedProps = {
        startOffset: firstRenderedIdx*lineWidth,
        endOffset: Math.min(lastRenderedIdx*lineWidth, byteLength),
        lineWidth: lineWidth
    };
    const gridProps = {
        ...scrollRelatedProps,
        data: dataView,
        overallLength: byteLength,
        cursorPosition: props.cursorPosition,
        setCursorPosition: props.setCursorPosition,
        selection: props.selection,
        setSelection: props.setSelection,
        highlightRanges: props.highlightRanges
    };
    return (
        <div className={props.className} style={{...props.style, overflow: "auto"}} ref={ref}>
            <div style={{display: "flex", flex: 1}}>
                <div style={{flexShrink: 1}}>
                    <div style={{height: listHeight, position: "relative", margin: ".5em"}}>
                        <div style={{transform: `translateY(${firstRenderedIdx*elementHeight}px)`}}>
                            <AddressGutter {...scrollRelatedProps}/>
                        </div>
                    </div>
                </div>
                <div style={{borderLeft: "1px solid red", margin: "0 .1em"}}/>
                <div style={{flexShrink: 1}}>
                    <div style={{height: listHeight, position: "relative", margin: ".5em"}}>
                        <div style={{transform: `translateY(${firstRenderedIdx*elementHeight}px)`}}>
                            <DataGrid {...gridProps}
                                renderer={byteAsHex}
                                className="spaced"/>
                        </div>
                    </div>
                </div>
                <div style={{borderLeft: "1px solid red", margin: "0 .1em"}}/>
                <div style={{flexShrink: 1}}>
                    <div style={{height: listHeight, position: "relative", margin: ".5em"}}>
                        <div style={{transform: `translateY(${firstRenderedIdx*elementHeight}px)`}}>
                            <DataGrid {...gridProps}
                                renderer={byteAsAscii}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}