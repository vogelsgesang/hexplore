import { HexViewerConfig, ColumnConfig, ColumnType, AddressGutterConfig, AddressDisplayMode, AsciiColumnConfig, IntegerColumnConfig, IntegerDisplayMode, getAlignment } from "./HexViewerConfig";
import React, { useState } from "react";
import {produce} from "immer";
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';

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
        widthSteps = Math.max(widthSteps, getAlignment(c));
    }
    let widthOptions = [];
    for (let w = widthSteps; w <= 128; w += widthSteps) {
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

    function addAddressGutter() {
        setConfig(produce(config, (draft)=>{
            draft.columns.push(new AddressGutterConfig(0, AddressDisplayMode.Hexadecimal, 0));
        }));
    }
    function addIntegerColumn() {
        setConfig(produce(config, (draft)=>{
            draft.columns.push(new IntegerColumnConfig(false, 1, true, IntegerDisplayMode.Decimal));
        }));
    }
    function addHexColumn() {
        setConfig(produce(config, (draft)=>{
            draft.columns.push(new IntegerColumnConfig(false, 1, true, IntegerDisplayMode.Hexadecimal));
        }));
    }
    function addAsciiColumn() {
        setConfig(produce(config, (draft)=>{
            draft.columns.push(new AsciiColumnConfig());
        }));
    }
    function moveUp(pos : number) {
        setConfig(produce(config, (draft)=>{
            let tmp = draft.columns[pos-1];
            draft.columns[pos-1] = draft.columns[pos];
            draft.columns[pos] = tmp;
        }));
    }
    function moveDown(pos : number) {
        moveUp(pos+1);
    }
    function removeColumn(pos : number) {
        setConfig(produce(config, (draft)=>{
            draft.columns.splice(pos, 1);
        }));
    }
    function setColumnConfig(pos : number, columnConfig : ColumnConfig) {
        setConfig(produce(config, (draft)=>{
            draft.columns.splice(pos, 1, columnConfig);
            let alignment = getAlignment(columnConfig);
            draft.lineWidth = Math.ceil(draft.lineWidth/alignment) * alignment;
        }));
    }

    function columnDescription(columnConfig : ColumnConfig) {
        switch (columnConfig.columnType) {
            case ColumnType.AddressGutter: {
                return "Address Gutter";
            }
            case ColumnType.AsciiColumn: {
                return "ASCII";
            }
            case ColumnType.IntegerColumn: {
                let c = columnConfig as IntegerColumnConfig;
                let d = "";
                if (c.signed) {
                    d += "Signed "
                }
                d += c.width + "-byte ";
                switch (c.displayMode) {
                    case IntegerDisplayMode.Binary: d += "Binary"; break;
                    case IntegerDisplayMode.Octal: d += "Octal"; break;
                    case IntegerDisplayMode.Decimal: d += "Decimal"; break;
                    case IntegerDisplayMode.Hexadecimal: d += "Hex"; break;
                }
                if (!c.littleEndian) {
                    d += " (BE)"
                }
                return d;
            }
        }
    }

    function columnEditor(idx : number) {
        let columnConfig = config.columns[idx];
        switch (columnConfig.columnType) {
            case ColumnType.AddressGutter: {
                return <AddressGutterConfigEditor columnConfig={columnConfig as AddressGutterConfig} setColumnConfig={setColumnConfig.bind(undefined, i)}/>;
            }
            case ColumnType.AsciiColumn: {
                return <React.Fragment></React.Fragment>;
            }
            case ColumnType.IntegerColumn: {
                return <IntegerColumnConfigEditor columnConfig={columnConfig as IntegerColumnConfig} setColumnConfig={setColumnConfig.bind(undefined, i)}/>;
            }
        }
    }

    let columnItems = [];
    for (var i = 0; i < config.columns.length; ++i) {
        let isFirst = i == 0;
        let isLast = i == config.columns.length - 1;
        columnItems.push(
            <ListGroup.Item key={i}>
                {columnDescription(config.columns[i])}
                <ButtonGroup>
                    <Button disabled={isFirst} onClick={moveUp.bind(undefined, i)} size="sm">Up</Button>
                    <Button disabled={isLast} onClick={moveDown.bind(undefined, i)} size="sm">Down</Button>
                    <Button onClick={removeColumn.bind(undefined, i)} size="sm">X</Button>
                </ButtonGroup>
                {columnEditor(i)}
            </ListGroup.Item>
        );
    }

    return (
        <React.Fragment>
            <ListGroup variant="flush">
                <ListGroup.Item>
                    {lineWidthSelector}
                </ListGroup.Item>
                {columnItems}
                <ListGroup.Item>
                    <Dropdown>
                        <Dropdown.Toggle variant="primary" block size="sm" id={"dropdown-"+uniqueId}>
                            Add column
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item onClick={addAddressGutter}>Add Address Gutter</Dropdown.Item>
                            <Dropdown.Item onClick={addIntegerColumn}>Add Integer Column</Dropdown.Item>
                            <Dropdown.Item onClick={addHexColumn}>Add Hex Column</Dropdown.Item>
                            <Dropdown.Item onClick={addAsciiColumn}>Add ASCII Column</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </ListGroup.Item>
            </ListGroup>
        </React.Fragment>
    );
}

interface AddressGutterConfigEditorProps {
    columnConfig : AddressGutterConfig,
    setColumnConfig : (columnConfig : AddressGutterConfig) => void
}

function AddressGutterConfigEditor({columnConfig, setColumnConfig} : AddressGutterConfigEditorProps) {
    let id = useUniqueId();
    let changeBase = (v : AddressDisplayMode) => {
        setColumnConfig(produce(columnConfig, (draft) => {
            draft.displayMode = v;
        }));
    };
    return (
        <React.Fragment>
            <Form.Group controlId={"b"+id}>
                <Form.Label>Base</Form.Label>
                <ToggleButtonGroup type="radio" name={"b"+id} value={columnConfig.displayMode} onChange={changeBase} size="sm">
                    <ToggleButton value={AddressDisplayMode.Decimal}>10</ToggleButton>
                    <ToggleButton value={AddressDisplayMode.Hexadecimal}>16</ToggleButton>
                </ToggleButtonGroup>
            </Form.Group>
        </React.Fragment>
    );
}

interface IntegerColumnConfigEditorProps {
    columnConfig : IntegerColumnConfig,
    setColumnConfig : (columnConfig : IntegerColumnConfig) => void
}

function IntegerColumnConfigEditor({columnConfig, setColumnConfig} : IntegerColumnConfigEditorProps) {
    let id = useUniqueId();
    let changeWidth = (v : 1 | 2 | 4 | 8) => {
        setColumnConfig(produce(columnConfig, (draft) => {
            draft.width = v;
        }));
    };
    let changeBase = (v : IntegerDisplayMode) => {
        setColumnConfig(produce(columnConfig, (draft) => {
            draft.displayMode = v;
        }));
    };
    let changeLE = (v : boolean) => {
        setColumnConfig(produce(columnConfig, (draft) => {
            draft.littleEndian = v;
        }));
    };
    let changeSigned = (v : boolean) => {
        setColumnConfig(produce(columnConfig, (draft) => {
            draft.signed = v;
        }));
    };
    return (
        <React.Fragment>
            <Form.Group controlId={"w"+id}>
                <Form.Label>Width</Form.Label>
                <ToggleButtonGroup type="radio" name={"w"+id} value={columnConfig.width} onChange={changeWidth} size="sm">
                    <ToggleButton value={1}>1</ToggleButton>
                    <ToggleButton value={2}>2</ToggleButton>
                    <ToggleButton value={4}>4</ToggleButton>
                    <ToggleButton value={8}>8</ToggleButton>
                </ToggleButtonGroup>
            </Form.Group>
            <Form.Group controlId={"b"+id}>
                <Form.Label>Base</Form.Label>
                <ToggleButtonGroup type="radio" name={"b"+id} value={columnConfig.displayMode} onChange={changeBase} size="sm">
                    <ToggleButton value={IntegerDisplayMode.Binary}>2</ToggleButton>
                    <ToggleButton value={IntegerDisplayMode.Octal}>8</ToggleButton>
                    <ToggleButton value={IntegerDisplayMode.Decimal}>10</ToggleButton>
                    <ToggleButton value={IntegerDisplayMode.Hexadecimal}>16</ToggleButton>
                </ToggleButtonGroup>
            </Form.Group>
            <Form.Group controlId={"e"+id}>
                <Form.Label>Endianess</Form.Label>
                <ToggleButtonGroup type="radio" name={"e"+id} value={columnConfig.littleEndian} onChange={changeLE} size="sm">
                    <ToggleButton value={true}>Little</ToggleButton>
                    <ToggleButton value={false}>Big</ToggleButton>
                </ToggleButtonGroup>
            </Form.Group>
            <Form.Group controlId={"s"+id}>
                <ToggleButtonGroup type="radio" name={"s"+id} value={columnConfig.signed} onChange={changeSigned} size="sm">
                    <ToggleButton value={true}>Signed</ToggleButton>
                    <ToggleButton value={false}>Unsigned</ToggleButton>
                </ToggleButtonGroup>
            </Form.Group>
        </React.Fragment>
    );
}