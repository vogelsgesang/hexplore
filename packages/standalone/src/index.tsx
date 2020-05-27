import React, {useRef, useState, useEffect, useCallback} from "react";
import ReactDOM from "react-dom";
import {Range, HexViewer, HexViewerConfig, HexViewerHandle, defaultConfig} from "hexplore-hexview";
import {HexViewerConfigEditor} from "./HexViewerConfigEditor";
import {FileOpener} from "./FileOpener";
import {DataInspector, defaultInspectorRepresentations} from "./DataInspector";
import {AddressEditor, AddressEditorHandle} from "./AddressEditor";
import {BookmarksPanel, Bookmark} from "./BookmarksPanel";
import Button from "react-bootstrap/Button";
import {findFormat} from "./formats/formats";
import {TabbedSidebar, SidebarTab} from "./Sidebar";
import {Menu, Item, contextMenu} from "react-contexify";

import "hexplore-hexview/dist/hexview.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-contexify/dist/ReactContexify.min.css";

const styles: Array<string> = [
    "hv-highlight-red",
    "hv-highlight-green",
    "hv-highlight-blue",
    "hv-highlight-underline-red",
    "hv-highlight-underline-green",
    "hv-highlight-underline-blue",
];

function usePersistedURLState<T>(key: string, initialValue: T): [T, (v: T) => void] {
    const [v, setRaw] = useState<T>(() => {
        const params = new URLSearchParams(window.location.search);
        const urlParam = params.get(key);
        if (urlParam !== null) {
            return urlParam;
        }
        if (localStorage) {
            const storedState = localStorage.getItem(key);
            if (storedState != null) {
                try {
                    return JSON.parse(storedState);
                } catch (e) {
                    console.log("deleting invalid localStorage state", {key, storedState});
                    localStorage.removeItem(key);
                }
            }
        }
        return initialValue;
    });
    function set(v: T) {
        if (localStorage) {
            localStorage.setItem(key, JSON.stringify(v));
        }
        const params = new URLSearchParams(window.location.search);
        if (params.has(key)) {
            params.delete(key);
            window.history.replaceState(null, "", "?" + params.toString());
        }
        setRaw(v);
    }
    return [v, set];
}

function App() {
    const [data, setData] = useState<ArrayBuffer | undefined>(undefined);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selection, setSelection] = useState<Range>({from: 0, to: 1});
    const [bookmarks, setBookmarks] = useState<Array<Bookmark>>([]);
    const [viewConfig, setViewConfig] = useState<HexViewerConfig>(defaultConfig);
    const [activeSidebar, setActiveSidebar] = useState<string | undefined>("columnConfig");
    const bookmarkCnt = useRef(0);
    const addressEditorRef = useRef<AddressEditorHandle>(null);
    const hexViewerRef = useRef<HexViewerHandle>(null);
    const [sidebarSize, setSidebarSize] = useState<number>();

    const [theme, setTheme] = usePersistedURLState("theme", "light");
    const toggleTheme = () => {
        if (theme == "dark") setTheme("light");
        else if (theme == "light") setTheme("dark");
    };
    useEffect(() => {
        const cl = document.body.classList;
        cl.remove("dark-theme");
        cl.remove("light-theme");
        cl.add(theme + "-theme");
    }, [theme]);

    const addBookmarkForSelection = useCallback(() => {
        // Add mark
        const key = "m" + new Date().getTime();
        const className = styles[bookmarkCnt.current++ % styles.length];
        const newMark: Bookmark = {
            ...selection,
            className: className,
            key: key,
            name: "mark " + bookmarkCnt.current,
        };
        setBookmarks(bookmarks.concat([newMark]));
        setSelection({from: cursorPosition, to: cursorPosition + 1});
    }, [setBookmarks, bookmarks, setSelection, selection, cursorPosition]);

    const goto = useCallback(
        (p: number) => {
            if (hexViewerRef.current) {
                hexViewerRef.current.goto(p);
            }
        },
        [hexViewerRef],
    );
    const gotoBookmark = useCallback(
        (b: Bookmark) => {
            goto(b.from);
        },
        [goto],
    );
    const exportRange = useCallback(
        (r: Range, name: string) => {
            if (data === undefined) return;
            const blob = new Blob([new Uint8Array(data, r.from, r.to - r.from)], {type: "application/octet-stream"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.position = "absolute";
            a.style.visibility = "hidden";
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        [data],
    );
    const exportBookmarkRange = useCallback(
        (b: Bookmark) => {
            exportRange(b, b.name + ".bin");
        },
        [exportRange],
    );
    const exportSelectedRange = useCallback(() => {
        exportRange(selection, "range_" + selection.from + "_" + selection.to + ".bin");
    }, [exportRange, selection]);

    function setDataWrapped(data: ArrayBuffer) {
        setData(data);
        const format = findFormat(data);
        if (format !== undefined) {
            setBookmarks(format.getBookmarks(data));
        }
    }

    useEffect(
        function() {
            function onKeyDown(e: KeyboardEvent) {
                if (e.key == "g" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
                    addressEditorRef.current?.focus();
                    e.preventDefault();
                } else if (e.key.toLowerCase() == "m" && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
                    addBookmarkForSelection();
                    e.preventDefault();
                }
            }
            window.addEventListener("keydown", onKeyDown);
            return () => window.removeEventListener("keydown", onKeyDown);
        },
        [addressEditorRef, addBookmarkForSelection],
    );

    if (!data) {
        return <FileOpener setData={setDataWrapped} />;
    } else {
        return (
            <div style={{display: "flex", flexDirection: "column", height: "100%", alignContent: "stretch"}}>
                <Menu id="hexviewer-menu">
                    <Item onClick={exportSelectedRange}>Export Range</Item>
                    <Item onClick={addBookmarkForSelection}>Mark range</Item>
                </Menu>
                <div style={{flex: 1, minHeight: 0, display: "flex"}}>
                    <div
                        style={{flex: 1, minWidth: 0, display: "flex"}}
                        onContextMenu={e => {
                            contextMenu.show({id: "hexviewer-menu", event: e});
                            e.preventDefault();
                        }}
                    >
                        <HexViewer
                            ref={hexViewerRef}
                            data={data}
                            viewConfig={viewConfig}
                            cursorPosition={cursorPosition}
                            setCursorPosition={setCursorPosition}
                            selection={selection}
                            setSelection={setSelection}
                            highlightRanges={bookmarks}
                        />
                    </div>
                    <TabbedSidebar
                        active={activeSidebar}
                        setActive={setActiveSidebar}
                        size={sidebarSize}
                        setSize={setSidebarSize}
                    >
                        <SidebarTab id="columnConfig" caption="Column Config">
                            <HexViewerConfigEditor config={viewConfig} setConfig={setViewConfig} />
                        </SidebarTab>
                        <SidebarTab id="dataInspector" caption="Data Inspector">
                            <DataInspector
                                key="dataInspector"
                                data={data}
                                position={cursorPosition}
                                representations={defaultInspectorRepresentations}
                            />
                        </SidebarTab>
                        <SidebarTab id="bookmarks" caption="Bookmarks">
                            <BookmarksPanel
                                bookmarks={bookmarks}
                                setBookmarks={setBookmarks}
                                goto={gotoBookmark}
                                exportRange={exportBookmarkRange}
                            />
                        </SidebarTab>
                    </TabbedSidebar>
                </div>
                <div className="statusbar" style={{flex: 0, display: "flex"}}>
                    <span style={{padding: ".2em", display: "inline-block"}}>
                        Position:
                        <AddressEditor ref={addressEditorRef} address={cursorPosition} setAddress={goto} />
                    </span>
                    <span style={{flex: 1}} />
                    <span>
                        <Button onClick={toggleTheme} size="sm">
                            Switch theme
                        </Button>
                    </span>
                </div>
            </div>
        );
    }
}

window.addEventListener("DOMContentLoaded", _event => {
    const domContainer = document.querySelector("#main");
    ReactDOM.render(<App />, domContainer);
});
