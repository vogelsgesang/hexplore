import React, {useRef, useState, useEffect, useCallback} from "react";
import ReactDOM from "react-dom";
import {HighlightRange, Range, HexViewer, HexViewerConfig, defaultConfig} from "hexplore-hexview";
import objstr from "hexplore-hexview/dist/objstr";
import {HexViewerConfigEditor} from "./HexViewerConfigEditor";
import {FileOpener} from "./FileOpener";
import {DataInspector} from "./DataInspector";
import {AddressEditor} from "./AddressEditor";
import {
    RendererConfig,
    createAddressRendererConfig,
    createIntegerRendererConfig,
} from "hexplore-hexview/dist/ByteRenderer";

import "hexplore-hexview/dist/hexview.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

const styles: Array<string> = [
    "hv-highlight-red",
    "hv-highlight-green",
    "hv-highlight-blue",
    "hv-highlight-underline-red",
    "hv-highlight-underline-green",
    "hv-highlight-underline-blue",
];

const defaultInspectorRepresentations: RendererConfig[] = [
    createAddressRendererConfig(),
    createIntegerRendererConfig({displayBase: 10, width: 1, signed: true, fixedWidth: false}),
    createIntegerRendererConfig({displayBase: 10, width: 2, signed: true, fixedWidth: false}),
    createIntegerRendererConfig({displayBase: 10, width: 4, signed: true, fixedWidth: false}),
    createIntegerRendererConfig({displayBase: 10, width: 8, signed: true, fixedWidth: false}),
];

function App() {
    const [data, setData] = useState<ArrayBuffer | undefined>(undefined);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selection, setSelection] = useState<Range>({from: 0, to: 1});
    const [highlighted, setHighlighted] = useState<Array<HighlightRange>>([]);
    const [viewConfig, setViewConfig] = useState<HexViewerConfig>(defaultConfig);
    const [activeSidebar, setActiveSidebar] = useState<"columnConfig" | "dataInspector">("columnConfig");
    const nextStyle = useRef(0);
    const addressEditorRef = useRef<any>();
    const hexViewerRef = useRef<any>();

    useEffect(
        function() {
            function onKeyDown(e: KeyboardEvent) {
                if (!data) return;
                if (e.key == "g" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
                    addressEditorRef.current?.focus();
                    e.preventDefault();
                } else if (e.key.toLowerCase() == "m" && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    if (!e.shiftKey) {
                        // Add mark
                        const key = "m" + new Date().getTime();
                        const className = styles[nextStyle.current++ % styles.length];
                        const newMark: HighlightRange = {...selection, className: className, key: key};
                        setHighlighted(highlighted.concat([newMark]));
                        setSelection({from: cursorPosition, to: cursorPosition + 1});
                    } else if (e.shiftKey) {
                        // Remove all marks
                        setHighlighted([]);
                        nextStyle.current = 0;
                    }
                    e.preventDefault();
                }
            }
            window.addEventListener("keydown", onKeyDown);
            return () => window.removeEventListener("keydown", onKeyDown);
        },
        [addressEditorRef, data, cursorPosition, highlighted, setSelection, selection],
    );

    const goto = useCallback(
        (p: number) => {
            if (hexViewerRef.current) {
                hexViewerRef.current.goto(p);
            }
        },
        [hexViewerRef],
    );

    if (!data) {
        return <FileOpener setData={setData} />;
    } else {
        let sidebarContent;
        if (activeSidebar == "columnConfig") {
            sidebarContent = <HexViewerConfigEditor config={viewConfig} setConfig={setViewConfig} />;
        } else if (activeSidebar == "dataInspector") {
            sidebarContent = (
                <DataInspector
                    data={data}
                    position={cursorPosition}
                    representations={defaultInspectorRepresentations}
                />
            );
        }

        return (
            <div style={{display: "flex", flexDirection: "column", height: "100%", alignContent: "stretch"}}>
                <div style={{flex: 1, minHeight: 0, display: "flex"}}>
                    <div style={{flex: 1, minWidth: 0, display: "flex"}}>
                        <HexViewer
                            ref={hexViewerRef}
                            data={data}
                            viewConfig={viewConfig}
                            cursorPosition={cursorPosition}
                            setCursorPosition={setCursorPosition}
                            selection={selection}
                            setSelection={setSelection}
                            highlightRanges={highlighted}
                        />
                    </div>
                    <div
                        style={{
                            width: "15em",
                            overflow: "auto",
                            borderLeft: "1px solid #999",
                            background: "#fcfcfc",
                        }}
                    >
                        {sidebarContent}
                    </div>
                    <div className="sidebar-tabs">
                        <div
                            onClick={() => setActiveSidebar("columnConfig")}
                            className={objstr({
                                "sidebar-tab": true,
                                selected: activeSidebar == "columnConfig",
                            })}
                        >
                            Column Config
                        </div>
                        <div
                            onClick={() => setActiveSidebar("dataInspector")}
                            className={objstr({
                                "sidebar-tab": true,
                                selected: activeSidebar == "dataInspector",
                            })}
                        >
                            Data Inspector
                        </div>
                    </div>
                </div>
                <div style={{flex: 0, borderTop: "1px solid #999", background: "#fcfcfc"}}>
                    <span style={{padding: ".2em", display: "inline-block"}}>
                        Position:
                        <AddressEditor ref={addressEditorRef} address={cursorPosition} setAddress={goto} />
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
