import React, {ReactElement, ReactNode, CSSProperties, useRef, useEffect, RefObject} from "react";
import objstr from "hexplore-hexview/dist/objstr";

import "./Sidebar.css";

export interface SidebarTabProps {
    caption: string;
    children: ReactNode | ReactNode[];
}

export function SidebarTab({children}: SidebarTabProps) {
    return <>{children}</>;
}

export interface SidebarProps {
    children: ReactElement<SidebarTabProps> | ReactElement<SidebarTabProps>[];
    active: React.Key | undefined;
    setActive: (a: React.Key | undefined) => void;
    size?: number;
    setSize?: (s: number) => void;
}

export function TabbedSidebar({active, setActive, size, setSize, children}: SidebarProps) {
    let selectedContent = undefined;
    React.Children.forEach(children, e => {
        if (e.key === active) {
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

    return (
        <React.Fragment>
            {renderedTab}
            <div className="sidebar-tabs">
                {React.Children.map(children, e => {
                    const k = e.key;
                    if (k === null) {
                        return;
                    }
                    return (
                        <div
                            onClick={() => setActive(k === active ? undefined : k)}
                            className={objstr({
                                "sidebar-tab": true,
                                selected: active === e.key,
                            })}
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
        onDrag: d => {
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
