import { HexViewerConfig, ColumnConfig, ColumnType, AddressGutterConfig, AddressDisplayMode, AsciiColumnConfig, IntegerColumnConfig, IntegerDisplayMode } from "./HexViewerConfig";
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

    function columnDescription(columnConfig : ColumnConfig) {
        switch (columnConfig.columnType) {
            case ColumnType.AddressGutter: {
                return <span>AddressGutter</span>;
            }
            case ColumnType.AsciiColumn: {
                return <span>ASCII</span>;
            }
            case ColumnType.IntegerColumn: {
                return <span>Integer</span>;
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


function IntegerColumnSetting() {
    return (
        <React.Fragment>
            <Form.Group>
                <Form.Label>Width</Form.Label>
                <ToggleButtonGroup type="radio" name="options" defaultValue={1} size="sm">
                    <ToggleButton value={1}>1</ToggleButton>
                    <ToggleButton value={2}>2</ToggleButton>
                    <ToggleButton value={4}>4</ToggleButton>
                    <ToggleButton value={8}>8</ToggleButton>
                </ToggleButtonGroup>
            </Form.Group>
            <Form.Group>
                <Form.Label>Base</Form.Label>
                <ToggleButtonGroup type="radio" name="options" defaultValue={16} size="sm">
                    <ToggleButton value={8}>8</ToggleButton>
                    <ToggleButton value={10}>10</ToggleButton>
                    <ToggleButton value={16}>16</ToggleButton>
                </ToggleButtonGroup>
            </Form.Group>
            <Form.Group>
                <Form.Label>Endianess</Form.Label>
                <ToggleButtonGroup type="radio" name="options" defaultValue="le" size="sm">
                    <ToggleButton value="le">Little</ToggleButton>
                    <ToggleButton value="be">Big</ToggleButton>
                </ToggleButtonGroup>
            </Form.Group>
            <Form.Group>
                <ToggleButtonGroup type="radio" name="options" defaultValue="signed" size="sm">
                    <ToggleButton value="signed">Signed</ToggleButton>
                    <ToggleButton value="unsigned">Unsigned</ToggleButton>
                </ToggleButtonGroup>
            </Form.Group>
        </React.Fragment>
    );
}