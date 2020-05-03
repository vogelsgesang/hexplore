import {HexViewerConfig} from "hexplore-hexview";
import {
    humanReadableRendererName,
    IntegerDisplayBase,
    AddressDisplayBase,
    TextRendererConfig,
    getAlignment,
    RendererType,
    createAddressRendererConfig,
    createIntegerRendererConfig,
    createTextRendererConfig,
    AddressRendererConfig,
    IntegerRendererConfig,
    RendererConfig,
} from "hexplore-hexview/dist/ByteRenderer";
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
                draft.columns.push(createAddressRendererConfig());
            }),
        );
    }
    function addIntegerColumn() {
        setConfig(
            produce(config, draft => {
                draft.columns.push(createIntegerRendererConfig({displayBase: 10}));
            }),
        );
    }
    function addHexColumn() {
        setConfig(
            produce(config, draft => {
                draft.columns.push(createIntegerRendererConfig({displayBase: 16}));
            }),
        );
    }
    function addTextColumn() {
        setConfig(
            produce(config, draft => {
                draft.columns.push(createTextRendererConfig());
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
    function setColumnConfig(pos: number, columnConfig: RendererConfig) {
        setConfig(
            produce(config, draft => {
                draft.columns.splice(pos, 1, columnConfig);
                const alignment = getAlignment(columnConfig);
                draft.lineWidth = Math.ceil(draft.lineWidth / alignment) * alignment;
            }),
        );
    }

    function columnEditor(idx: number, childId: string) {
        const columnConfig = config.columns[idx];
        switch (columnConfig.rendererType) {
            case RendererType.Address: {
                return (
                    <AddressGutterConfigEditor
                        id={childId}
                        columnConfig={columnConfig as AddressRendererConfig}
                        setColumnConfig={setColumnConfig.bind(undefined, idx)}
                    />
                );
            }
            case RendererType.Text: {
                return (
                    <TextColumnConfigEditor
                        id={childId}
                        columnConfig={columnConfig as TextRendererConfig}
                        setColumnConfig={setColumnConfig.bind(undefined, idx)}
                    />
                );
            }
            case RendererType.Integer: {
                return (
                    <IntegerColumnConfigEditor
                        id={childId}
                        columnConfig={columnConfig as IntegerRendererConfig}
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
        const childId = uniqueId + "-" + i;
        columnItems.push(
            <div key={i} role="group" aria-labelledby={childId + "-caption"}>
                <div className="hv-form-row">
                    <span id={childId + "-caption"}>{humanReadableRendererName(config.columns[i])}</span>
                    <ButtonGroup>
                        <Button
                            disabled={isFirst}
                            title="Move up"
                            onClick={moveUp.bind(undefined, i)}
                            size="sm"
                            variant="outline-secondary"
                        >
                            ⮝
                        </Button>
                        <Button
                            disabled={isLast}
                            title="Move down"
                            onClick={moveDown.bind(undefined, i)}
                            size="sm"
                            variant="outline-secondary"
                        >
                            ⮟
                        </Button>
                        <Button
                            title="Remove"
                            onClick={removeColumn.bind(undefined, i)}
                            size="sm"
                            variant="outline-danger"
                        >
                            X
                        </Button>
                    </ButtonGroup>
                </div>
                <div className="hv-renderer-details">{columnEditor(i, childId)}</div>
            </div>,
        );
    }

    return (
        <div className="hexviewerconfigeditor">
            <div>{lineWidthSelector}</div>
            <div className="hv-renderer-list">{columnItems}</div>
            <div className="hv-add-renderer">
                <Dropdown>
                    <Dropdown.Toggle variant="primary" block size="sm" id={"dropdown-" + uniqueId}>
                        Add column
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item onClick={addAddressGutter}>Add Address Gutter</Dropdown.Item>
                        <Dropdown.Item onClick={addIntegerColumn}>Add Integer Column</Dropdown.Item>
                        <Dropdown.Item onClick={addHexColumn}>Add Hex Column</Dropdown.Item>
                        <Dropdown.Item onClick={addTextColumn}>Add Text Column</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    );
}

interface ColumnConfigEditorProps<T> {
    id: string;
    columnConfig: T;
    setColumnConfig: (columnConfig: T) => void;
}

function AddressGutterConfigEditor({
    id,
    columnConfig,
    setColumnConfig,
}: ColumnConfigEditorProps<AddressRendererConfig>) {
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
                <Form.Label id={id + "-base"}>Base</Form.Label>
                <ToggleButtonGroup
                    aria-labelledby={id + "-base"}
                    type="radio"
                    name={id + "-base"}
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

function TextColumnConfigEditor({id, columnConfig, setColumnConfig}: ColumnConfigEditorProps<TextRendererConfig>) {
    return (
        <React.Fragment>
            <div className="hv-form-row">
                <Form.Label id={id + "-encoding"}>Encoding</Form.Label>
                <select
                    aria-labelledby={id + "-encoding"}
                    value={columnConfig.encoding}
                    onChange={e =>
                        setColumnConfig({...columnConfig, encoding: e.target.value as typeof columnConfig.encoding})
                    }
                >
                    <option value="ascii">ASCII</option>
                    <option value="utf8">UTF-8</option>
                    <option value="utf16le">UTF-16 (LE)</option>
                    <option value="utf16be">UTF-16 (BE)</option>
                    <option value="utf32le">UTF-32 (LE)</option>
                    <option value="utf32be">UTF-32 (BE)</option>
                </select>
            </div>
        </React.Fragment>
    );
}

function IntegerColumnConfigEditor({
    id,
    columnConfig,
    setColumnConfig,
}: ColumnConfigEditorProps<IntegerRendererConfig>) {
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
    const changeFixedWidth = (v: boolean) => {
        setColumnConfig(
            produce(columnConfig, draft => {
                draft.fixedWidth = v;
            }),
        );
    };
    return (
        <React.Fragment>
            <div className="hv-form-row">
                <Form.Label id={id + "-width"}>Width</Form.Label>
                <ToggleButtonGroup
                    aria-labelledby={id + "-width"}
                    type="radio"
                    name={id + "-width"}
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
                <Form.Label id={id + "-base"}>Base</Form.Label>
                <ToggleButtonGroup
                    aria-labelledby={id + "-base"}
                    type="radio"
                    name={id + "-base"}
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
                <Form.Label id={id + "-endianess"}>Endianess</Form.Label>
                <ToggleButtonGroup
                    aria-labelledby={id + "-endianess"}
                    type="radio"
                    name={id + "-endianess"}
                    value={columnConfig.littleEndian}
                    onChange={changeLE}
                    size="sm"
                >
                    <ToggleButton value={true}>Little</ToggleButton>
                    <ToggleButton value={false}>Big</ToggleButton>
                </ToggleButtonGroup>
            </div>
            <div className="hv-form-row">
                <Form.Label id={id + "-sign"}>Sign</Form.Label>
                <ToggleButtonGroup
                    aria-labelledby={id + "-sign"}
                    type="radio"
                    name={id + "-sign"}
                    value={columnConfig.signed}
                    onChange={changeSigned}
                    size="sm"
                >
                    <ToggleButton value={true}>Signed</ToggleButton>
                    <ToggleButton value={false}>Unsigned</ToggleButton>
                </ToggleButtonGroup>
            </div>
            <div className="hv-form-row">
                <Form.Label id={id + "-fw"}>Fixed width</Form.Label>
                <ToggleButtonGroup
                    aria-labelledby={id + "-fw"}
                    type="radio"
                    name={id + "-fw"}
                    value={columnConfig.fixedWidth}
                    onChange={changeFixedWidth}
                    size="sm"
                >
                    <ToggleButton value={true}>Yes</ToggleButton>
                    <ToggleButton value={false}>No</ToggleButton>
                </ToggleButtonGroup>
            </div>
        </React.Fragment>
    );
}
