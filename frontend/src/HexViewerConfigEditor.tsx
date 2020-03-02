import { HexViewerConfig, ColumnConfig, ColumnType, AddressGutterConfig, AddressDisplayMode, AsciiColumnConfig, IntegerColumnConfig, IntegerDisplayMode } from "./HexViewerConfig";
import React, { useState } from "react";
import Dropdown from 'react-bootstrap/Dropdown';

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
    let uniqueId = useUniqueId();

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
    let lineWidthId = "linewidth-" + uniqueId;
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

    function addAddressGutter() {
        setConfig({...config, columns: [...config.columns, new AddressGutterConfig(0, AddressDisplayMode.Hexadecimal, 0)]});
    }
    function addIntegerColumn() {
        setConfig({...config, columns: [...config.columns, new IntegerColumnConfig(false, 1, true, IntegerDisplayMode.Decimal)]});
    }
    function addHexColumn() {
        setConfig({...config, columns: [...config.columns, new IntegerColumnConfig(false, 1, true, IntegerDisplayMode.Hexadecimal)]});
    }
    function addAsciiColumn() {
        setConfig({...config, columns: [...config.columns, new AsciiColumnConfig()]});
    }

    return (
        <React.Fragment>
            {lineWidthSelector}
            {config.columns.map(columnDescription)}
            <Dropdown>
                <Dropdown.Toggle variant="primary" id={"dropdown-"+uniqueId}    >
                    Add column
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Dropdown.Item onClick={addAddressGutter}>Add Address Gutter</Dropdown.Item>
                    <Dropdown.Item onClick={addIntegerColumn}>Add Integer Column</Dropdown.Item>
                    <Dropdown.Item onClick={addHexColumn}>Add Hex Column</Dropdown.Item>
                    <Dropdown.Item onClick={addAsciiColumn}>Add ASCII Column</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </React.Fragment>
    );
}