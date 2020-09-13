import React, {
    ReactElement,
    ReactNode,
    CSSProperties,
    useRef,
    useEffect,
    RefObject,
    useCallback,
    KeyboardEvent,
    createRef,
} from "react";
import objstr from "hexplore-hexview/dist/objstr";

import "./Sidebar.css";

export interface SidebarTabProps {
    id: string;
    caption: string;
    children: ReactNode | ReactNode[];
}

export function SidebarTab({children}: SidebarTabProps) {
    return <>{children}</>;
}

export interface SidebarProps {
    children: ReactElement<SidebarTabProps> | ReactElement<SidebarTabProps>[];
    active: string | undefined;
    setActive: (a: string | undefined) => void;
    size?: number;
    setSize?: (s: number) => void;
}

export function TabbedSidebar({active, setActive, size, setSize, children: reactChildren}: SidebarProps) {
    const children = React.Children.toArray(reactChildren) as ReactElement<SidebarTabProps>[];
    const elementsRef = useRef(React.Children.map(children, () => createRef<HTMLDivElement>()));

    let selectedContent = undefined;
    children.forEach((e) => {
        if (e.props.id === active) {
            selectedContent = e;
        }
    });
    let renderedTab = null;
    if (selectedContent) {
        renderedTab = (
            <Resizable className="sidebar-content" size={size} setSize={setSize}>
                {selectedContent}
            </Resizable>
        );
    }

    const onKeyDown = useCallback(
        (idx: number, e: KeyboardEvent) => {
            let activated;
            let toggle = false;
            switch (e.key) {
                case " ":
                case "Enter":
                    activated = idx;
                    toggle = true;
                    break;
                case "ArrowUp":
                    if (idx != 0) activated = idx - 1;
                    break;
                case "ArrowDown":
                    if (idx < React.Children.count(children) - 1) activated = idx + 1;
                    break;
            }
            if (activated != undefined) {
                e.preventDefault();
                elementsRef.current[activated].current?.focus();
                elementsRef.current[activated].current?.scrollIntoView();
                const k = children[activated].props.id;
                if (k === null) {
                    return;
                }
                setActive(toggle && k === active ? undefined : k);
            }
        },
        [children, active, setActive],
    );

    return (
        <React.Fragment>
            {renderedTab}
            <div className="sidebar-tabs">
                {children.map((e, i) => {
                    const k = e.props.id;
                    if (k === null) {
                        return;
                    }
                    return (
                        <div
                            key={k}
                            ref={elementsRef.current[i]}
                            tabIndex={0}
                            className={objstr({
                                "sidebar-tab": true,
                                selected: active === e.props.id,
                            })}
                            onClick={() => setActive(k === active ? undefined : k)}
                            onKeyDown={onKeyDown.bind(undefined, i)}
                        >
                            {e.props.caption}
                        </div>
                    );
                })}
            </div>
        </React.Fragment>
    );
}

interface ResizableProps {
    className?: string;
    children: ReactNode | ReactNode[];
    size?: number;
    setSize?: (s: number) => void;
}

interface Pos {
    x: number;
    y: number;
}

interface DraggableHookProps<T> {
    ref: RefObject<T>;
    onStart?: () => void;
    onDrag: (difference: Pos) => void;
    onStop?: () => void;
}

function useDraggable<T extends HTMLElement>({ref, onDrag, onStart, onStop}: DraggableHookProps<T>) {
    const startPos = useRef<Pos>();
    function start(e: MouseEvent) {
        if (!ref.current) return;
        if (e.button !== 0) return;
        if (onStart) onStart();
        startPos.current = {x: e.pageX, y: e.pageY};
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", stop);
        // Prevent default, to disable text selection
        e.preventDefault();
    }

    function move(e: MouseEvent) {
        if (!startPos.current) return;
        onDrag({
            x: e.pageX - startPos.current.x,
            y: e.pageY - startPos.current.y,
        });
    }

    function stop() {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", stop);
        if (onStop) onStop();
    }

    useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        el.addEventListener("mousedown", start);
        return () => {
            el.removeEventListener("mousedown", start);
        };
    });
}

function Resizable({size, setSize, children, className}: ResizableProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sizeHandleRef = useRef<HTMLDivElement>(null);
    const startSize = useRef<number>();

    useDraggable({
        ref: sizeHandleRef,
        onStart: () => {
            if (!containerRef.current) return;
            startSize.current = containerRef.current.clientWidth;
        },
        onDrag: (d) => {
            if (!setSize || !startSize.current) return;
            setSize(Math.min(Math.max(startSize.current - d.x, 10), 1000));
        },
    });

    const style: CSSProperties = {};
    if (size !== undefined) style.width = size + "px";
    let resizeHandle;
    if (setSize !== undefined) {
        resizeHandle = <div className="sidebar-resizer" ref={sizeHandleRef} />;
    }
    return (
        <div className="sidebar-resize-wrapper">
            {resizeHandle}
            <div className={className} style={style} ref={containerRef}>
                {children}
            </div>
        </div>
    );
}
