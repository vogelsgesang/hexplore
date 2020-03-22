import {
    HexViewerConfig,
    ColumnConfig,
    ColumnType,
    AddressGutterConfig,
    AsciiColumnConfig,
    IntegerColumnConfig,
    getAlignment,
    IntegerDisplayBase,
    AddressDisplayBase,
} from "./HexViewerConfig";
import React, {useState} from "react";
import {produce} from "immer";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";

import "./HexViewerConfigEditor.css";

let nextId = 0;
function useUniqueId() {
    const [id] = useState(() => "id-" + ++nextId);
    return id;
}

interface HexViewerConfigEditorProps {
    config: HexViewerConfig;
    setConfig: (config: HexViewerConfig) => void;
}

export function HexViewerConfigEditor({config, setConfig}: HexViewerConfigEditorProps) {
    const uniqueId = useUniqueId();

    let widthSteps = 1;
    for (const c of config.columns) {
        widthSteps = Math.max(widthSteps, getAlignment(c));
    }
    const widthOptions = [];
    for (let w = widthSteps; w <= 128; w += widthSteps) {
        widthOptions.push(
            <option value={w} key={w}>
                {w}
            </option>,
        );
    }
    const lineWidthId = "linewidth-" + uniqueId;
    const lineWidthSelector = (
        <div className="hv-form-row">
            <label htmlFor={lineWidthId}>Line Width: </label>
            <select
                id={lineWidthId}
                value={config.lineWidth}
                onChange={e => setConfig({...config, lineWidth: Number.parseInt(e.target.value)})}
            >
                {widthOptions}
            </select>
        </div>
    );

    function addAddressGutter() {
        setConfig(
            produce(config, draft => {
                draft.columns.push(new AddressGutterConfig(16));
            }),
        );
    }
    function addIntegerColumn() {
        setConfig(
            produce(config, draft => {
                draft.columns.push(new IntegerColumnConfig(false, 1, true, 10));
            }),
        );
    }
    function addHexColumn() {
        setConfig(
            produce(config, draft => {
                draft.columns.push(new IntegerColumnConfig(false, 1, true, 16));
            }),
        );
    }
    function addAsciiColumn() {
        setConfig(
            produce(config, draft => {
                draft.columns.push(new AsciiColumnConfig());
            }),
        );
    }
    function moveUp(pos: number) {
        setConfig(
            produce(config, draft => {
                const tmp = draft.columns[pos - 1];
                draft.columns[pos - 1] = draft.columns[pos];
                draft.columns[pos] = tmp;
            }),
        );
    }
    function moveDown(pos: number) {
        moveUp(pos + 1);
    }
    function removeColumn(pos: number) {
        setConfig(
            produce(config, draft => {
                draft.columns.splice(pos, 1);
            }),
        );
    }
    function setColumnConfig(pos: number, columnConfig: ColumnConfig) {
        setConfig(
            produce(config, draft => {
                draft.columns.splice(pos, 1, columnConfig);
                const alignment = getAlignment(columnConfig);
                draft.lineWidth = Math.ceil(draft.lineWidth / alignment) * alignment;
            }),
        );
    }

    function columnDescription(columnConfig: ColumnConfig) {
        switch (columnConfig.columnType) {
            case ColumnType.AddressGutter: {
                return "Address Gutter";
            }
            case ColumnType.AsciiColumn: {
                return "ASCII";
            }
            case ColumnType.IntegerColumn: {
                const c = columnConfig as IntegerColumnConfig;
                let d = "";
                if (c.signed) {
                    d += "Signed ";
                }
                d += c.width + "-byte ";
                switch (c.displayBase) {
                    case 2:
                        d += "Binary";
                        break;
                    case 8:
                        d += "Octal";
                        break;
                    case 10:
                        d += "Decimal";
                        break;
                    case 16:
                        d += "Hex";
                        break;
                }
                if (!c.littleEndian) {
                    d += " (BE)";
                }
                return d;
            }
        }
    }

    function columnEditor(idx: number) {
        const columnConfig = config.columns[idx];
        switch (columnConfig.columnType) {
            case ColumnType.AddressGutter: {
                return (
                    <AddressGutterConfigEditor
                        columnConfig={columnConfig as AddressGutterConfig}
                        setColumnConfig={setColumnConfig.bind(undefined, idx)}
                    />
                );
            }
            case ColumnType.AsciiColumn: {
                return <React.Fragment></React.Fragment>;
            }
            case ColumnType.IntegerColumn: {
                return (
                    <IntegerColumnConfigEditor
                        columnConfig={columnConfig as IntegerColumnConfig}
                        setColumnConfig={setColumnConfig.bind(undefined, idx)}
                    />
                );
            }
        }
    }

    const columnItems = [];
    for (let i = 0; i < config.columns.length; ++i) {
        const isFirst = i == 0;
        const isLast = i == config.columns.length - 1;
        columnItems.push(
            <div key={i}>
                <div className="hv-form-row">
                    {columnDescription(config.columns[i])}
                    <ButtonGroup>
                        <Button
                            disabled={isFirst}
                            onClick={moveUp.bind(undefined, i)}
                            size="sm"
                            variant="outline-secondary"
                        >
                            ⮝
                        </Button>
                        <Button
                            disabled={isLast}
                            onClick={moveDown.bind(undefined, i)}
                            size="sm"
                            variant="outline-secondary"
                        >
                            ⮟
                        </Button>
                        <Button onClick={removeColumn.bind(undefined, i)} size="sm" variant="outline-danger">
                            X
                        </Button>
                    </ButtonGroup>
                </div>
                <div className="hv-column-details">{columnEditor(i)}</div>
            </div>,
        );
    }

    return (
        <div className="hexviewerconfigeditor">
            <div className="hv-linewidth-column">{lineWidthSelector}</div>
            <div className="hv-column-list">{columnItems}</div>
            <div className="hv-add-column">
                <Dropdown>
                    <Dropdown.Toggle variant="primary" block size="sm" id={"dropdown-" + uniqueId}>
                        Add column
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item onClick={addAddressGutter}>Add Address Gutter</Dropdown.Item>
                        <Dropdown.Item onClick={addIntegerColumn}>Add Integer Column</Dropdown.Item>
                        <Dropdown.Item onClick={addHexColumn}>Add Hex Column</Dropdown.Item>
                        <Dropdown.Item onClick={addAsciiColumn}>Add ASCII Column</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    );
}

interface AddressGutterConfigEditorProps {
    columnConfig: AddressGutterConfig;
    setColumnConfig: (columnConfig: AddressGutterConfig) => void;
}

function AddressGutterConfigEditor({columnConfig, setColumnConfig}: AddressGutterConfigEditorProps) {
    const id = useUniqueId();
    const changeBase = (v: AddressDisplayBase) => {
        setColumnConfig(
            produce(columnConfig, draft => {
                draft.displayBase = v;
            }),
        );
    };
    return (
        <React.Fragment>
            <div className="hv-form-row">
                Base
                <ToggleButtonGroup
                    type="radio"
                    name={"b" + id}
                    value={columnConfig.displayBase}
                    onChange={changeBase}
                    size="sm"
                >
                    <ToggleButton value={10}>10</ToggleButton>
                    <ToggleButton value={16}>16</ToggleButton>
                </ToggleButtonGroup>
            </div>
        </React.Fragment>
    );
}

interface IntegerColumnConfigEditorProps {
    columnConfig: IntegerColumnConfig;
    setColumnConfig: (columnConfig: IntegerColumnConfig) => void;
}

function IntegerColumnConfigEditor({columnConfig, setColumnConfig}: IntegerColumnConfigEditorProps) {
    const id = useUniqueId();
    const changeWidth = (v: 1 | 2 | 4 | 8) => {
        setColumnConfig(
            produce(columnConfig, draft => {
                draft.width = v;
            }),
        );
    };
    const changeBase = (v: IntegerDisplayBase) => {
        setColumnConfig(
            produce(columnConfig, draft => {
                draft.displayBase = v;
            }),
        );
    };
    const changeLE = (v: boolean) => {
        setColumnConfig(
            produce(columnConfig, draft => {
                draft.littleEndian = v;
            }),
        );
    };
    const changeSigned = (v: boolean) => {
        setColumnConfig(
            produce(columnConfig, draft => {
                draft.signed = v;
            }),
        );
    };
    return (
        <React.Fragment>
            <div className="hv-form-row">
                Width
                <ToggleButtonGroup
                    type="radio"
                    name={"w" + id}
                    value={columnConfig.width}
                    onChange={changeWidth}
                    size="sm"
                >
                    <ToggleButton value={1}>1</ToggleButton>
                    <ToggleButton value={2}>2</ToggleButton>
                    <ToggleButton value={4}>4</ToggleButton>
                    <ToggleButton value={8}>8</ToggleButton>
                </ToggleButtonGroup>
            </div>
            <div className="hv-form-row">
                <Form.Label>Base</Form.Label>
                <ToggleButtonGroup
                    type="radio"
                    name={"b" + id}
                    value={columnConfig.displayBase}
                    onChange={changeBase}
                    size="sm"
                >
                    <ToggleButton value={2}>2</ToggleButton>
                    <ToggleButton value={8}>8</ToggleButton>
                    <ToggleButton value={10}>10</ToggleButton>
                    <ToggleButton value={16}>16</ToggleButton>
                </ToggleButtonGroup>
            </div>
            <div className="hv-form-row">
                <Form.Label>Endianess</Form.Label>
                <ToggleButtonGroup
                    type="radio"
                    name={"e" + id}
                    value={columnConfig.littleEndian}
                    onChange={changeLE}
                    size="sm"
                >
                    <ToggleButton value={true}>Little</ToggleButton>
                    <ToggleButton value={false}>Big</ToggleButton>
                </ToggleButtonGroup>
            </div>
            <div className="hv-form-row">
                <span />
                <ToggleButtonGroup
                    type="radio"
                    name={"s" + id}
                    value={columnConfig.signed}
                    onChange={changeSigned}
                    size="sm"
                >
                    <ToggleButton value={true}>Signed</ToggleButton>
                    <ToggleButton value={false}>Unsigned</ToggleButton>
                </ToggleButtonGroup>
            </div>
        </React.Fragment>
    );
}
