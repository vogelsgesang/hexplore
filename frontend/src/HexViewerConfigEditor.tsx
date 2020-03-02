import { HexViewerConfig, ColumnConfig, ColumnType, AddressGutterConfig, AddressDisplayMode, AsciiColumnConfig, IntegerColumnConfig } from "./HexViewerConfig";
import React, { useState } from "react";

let nextId = 0;
function useUniqueId() {
    let [id] = useState(() => "id-"+(++nextId));
    return id;
}

interface HexViewerConfigEditorProps {
    config : HexViewerConfig,
    setConfig : (config : HexViewerConfig) => void
}

export function HexViewerConfigEditor({config, setConfig} : HexViewerConfigEditorProps) {
    let widthSteps = 1;
    for (let c of config.columns) {
        let width;
        switch (c.columnType) {
            case ColumnType.AddressGutter: width = 1; break;
            case ColumnType.AsciiColumn: width = 1; break;
            case ColumnType.IntegerColumn: width = (c as IntegerColumnConfig).width; break;
        }
        widthSteps = Math.max(widthSteps, width);
    }
    let widthOptions = [];
    for (let w = 1; w <= 128; w += widthSteps) {
        widthOptions.push(<option value={w} key={w}>{w}</option>);
    }
    let lineWidthId = useUniqueId();
    let lineWidthSelector = (
        <div>
            <label htmlFor={lineWidthId}>Line Width: </label>
            <select id={lineWidthId} value={config.lineWidth} onChange={(e) => setConfig({...config, lineWidth: Number.parseInt(e.target.value)})}>
                {widthOptions}
           </select>
        </div>
    );

    function columnDescription(columnConfig : ColumnConfig) {
        switch (columnConfig.columnType) {
            case ColumnType.AddressGutter: {
                return <div>AddressGutter</div>;
            }
            case ColumnType.AsciiColumn: {
                return <div>ASCII</div>;
            }
            case ColumnType.IntegerColumn: {
                return <div>Integer</div>;
            }
        }
    }

    return (
        <React.Fragment>
            {lineWidthSelector}
            {config.columns.map(columnDescription)}
        </React.Fragment>
    );
}