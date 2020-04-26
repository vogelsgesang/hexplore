import {assert} from "./util";
import {useEffect, useLayoutEffect, RefObject, useState} from 'react';
import ResizeObserver from "resize-observer-polyfill";

interface Vector2 {
    x: number;
    y: number;
}

export function useScrollAware<T extends HTMLElement>(ref: RefObject<T>): Vector2 {
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
    }, [ref]);

    return scrollPos;
}

export function useSizeAware<T extends HTMLElement>(ref: RefObject<T>): Vector2 {
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
    }, [ref]);
    return size;
}

function memoizeConstant<T>(f: () => T) {
    let done = false;
    let v: T;
    return () => {
        if (!done) {
            v = f();
            done = true;
        }
        return v;
    };
}

const calcMaxBrowserScrollSize = memoizeConstant(
    (): Vector2 => {
        const div = document.createElement("div");
        const style = div.style;
        style.position = "absolute";
        style.left = "99999999999999px";
        style.top = "9999999999999999px";
        document.body.appendChild(div);

        const rect = div.getBoundingClientRect();
        const size = {x: rect.left, y: rect.top};
        document.body.removeChild(div);
        return size;
    },
);

export function useVirtualScroll<T extends HTMLElement>(
    ref: RefObject<T>,
    {elementSize, elementCount}: {elementSize: number; elementCount: number},
) {
    const scrollPos = useScrollAware(ref);
    const size = useSizeAware(ref);

    const viewportHeight = size.y;
    const paddingSize = 0.5 * viewportHeight;
    const scrollY = scrollPos.y;

    const firstRenderedLine = Math.max(Math.floor((scrollY - paddingSize) / elementSize), 0);
    const lastRenderedLine = Math.min(Math.ceil((scrollY + viewportHeight + paddingSize) / elementSize), elementCount);

    return {lineStart: firstRenderedLine, lineLimit: lastRenderedLine + 1};
}
