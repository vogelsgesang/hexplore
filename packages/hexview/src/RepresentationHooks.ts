import {assert} from "./util";
import {useEffect, useLayoutEffect, RefObject, useState, useRef} from "react";
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

export function useVirtualScroll<T extends HTMLElement>({
    elementSize,
    elementCount,
    ref,
}: {
    elementSize: number;
    elementCount: number;
    ref: RefObject<T>;
}) {
    const scrollPos = useScrollAware(ref);
    const size = useSizeAware(ref);

    const viewportHeight = size.y;
    const paddingSize = 0.5 * viewportHeight;
    const scrollY = scrollPos.y;

    const firstRenderedLine = Math.max(Math.floor((scrollY - paddingSize) / elementSize), 0);
    const lastRenderedLine = Math.min(Math.ceil((scrollY + viewportHeight + paddingSize) / elementSize), elementCount);

    return {lineStart: firstRenderedLine, lineLimit: lastRenderedLine + 1};
}

export function useInfiniteScroll<T extends HTMLElement>({
    elementSize,
    elementCount,
    ref,
    margin = 0,
}: {
    elementSize: number;
    elementCount: number;
    ref: RefObject<T>;
    margin?: number;
}) {
    // Follows the approach from
    // https://medium.com/@manju_reddys/rendering-array-of-billion-of-records-at-60-f-s-in-angular-or-vanilla-js-2613e5983a10
    // https://github.com/mleibman/SlickGrid/blob/master/slick.grid.js
    const scrollPos = useScrollAware(ref).y;
    const prevScrollPos = useRef(0);
    const virtualScrollPos = useRef(0);
    const viewportSize = useSizeAware(ref).y;

    // Compute sizes
    const virtualSize = elementSize * elementCount + 2 * margin;
    const maxScrollSize = 6000000; // Just a large value which works well in all browsers
    let physicalScrollSize, edgeMargin, pageSize, numPages, pageOverlap;
    if (virtualSize <= maxScrollSize) {
        // Fits into a normal virtual scroll widget; no paging required
        physicalScrollSize = virtualSize;
        pageSize = virtualSize;
        edgeMargin = virtualSize;
        numPages = 1;
        pageOverlap = 0;
    } else {
        // Need to paginate the scrolling
        physicalScrollSize = maxScrollSize;
        pageSize = physicalScrollSize / 100;
        edgeMargin = 1000;
        numPages = Math.ceil((virtualSize - 2 * edgeMargin) / pageSize);
        pageOverlap = (virtualSize - (physicalScrollSize - 2 * edgeMargin)) / (numPages - 1);
    }

    if (ref.current && scrollPos != prevScrollPos.current) {
        // The user scrolled. Handle his scrolling
        // Figure out if we have a "near" or a "far" jump based on the scroll speed
        if (Math.abs(scrollPos - prevScrollPos.current) > 10 * viewportSize) {
            // The user jumped (e.g. by dragging the slider)
            if (scrollPos < edgeMargin) {
                virtualScrollPos.current = scrollPos;
            } else if (physicalScrollSize - viewportSize - scrollPos < edgeMargin) {
                virtualScrollPos.current = virtualSize - physicalScrollSize + scrollPos;
            } else {
                const percentPos = scrollPos / (physicalScrollSize - viewportSize);
                const page = Math.min(Math.floor(percentPos * numPages), numPages - 1);
                virtualScrollPos.current =
                    page * pageSize + (scrollPos - (page == 0 ? 0 : edgeMargin) - page * (pageSize - pageOverlap));
            }
        } else {
            // The user scrolled by a small amount (e.g. using the "up"/"down" arrows on the sidebar)
            virtualScrollPos.current += scrollPos - prevScrollPos.current;
        }
        prevScrollPos.current = scrollPos;
    }
    // Renormalize the scroll position. This should only trigger on page changes
    let physicalScrollPos: number;
    if (virtualScrollPos.current <= edgeMargin) {
        physicalScrollPos = virtualScrollPos.current;
    } else if (virtualSize - viewportSize - virtualScrollPos.current <= edgeMargin) {
        physicalScrollPos = physicalScrollSize + virtualScrollPos.current - virtualSize;
    } else {
        const currPage = Math.floor(virtualScrollPos.current / pageSize);
        physicalScrollPos =
            (currPage == 0 ? 0 : edgeMargin) +
            currPage * (pageSize - pageOverlap) +
            (virtualScrollPos.current - currPage * pageSize);
    }

    useLayoutEffect(
        function() {
            if (ref.current && Math.abs(physicalScrollPos - ref.current.scrollTop) > 0) {
                // This introduces a small jump in the scroll bar, but I don't know how else to build infite scrolling
                ref.current.scrollTop = physicalScrollPos;
                prevScrollPos.current = physicalScrollPos;
            }
        },
        [physicalScrollPos, ref],
    );

    // Compute the parameters for rendering
    const viewOffset = virtualScrollPos.current - physicalScrollPos;
    const start = Math.max(Math.floor((virtualScrollPos.current - viewportSize - margin) / elementSize), 0);
    const end = Math.min(Math.ceil((virtualScrollPos.current - margin + 2 * viewportSize) / elementSize), elementCount);

    return {lineStart: start, lineLimit: end, physicalScrollSize, viewOffset};
}
