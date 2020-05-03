import React from "react";
import snapshotRenderer from "react-test-renderer";
import {
    render,
    fireEvent,
    screen,
    getByTitle,
    queryByText,
    getByLabelText,
    getAllByRole,
    getNodeText,
} from "@testing-library/react";
import {defaultConfig, HexViewerConfig} from "hexplore-hexview";
import {HexViewerConfigEditor} from "./HexViewerConfigEditor";
import {
    createTextRendererConfig,
    createAddressRendererConfig,
    createIntegerRendererConfig,
    AddressRendererConfig,
    IntegerRendererConfig,
    TextRendererConfig,
} from "hexplore-hexview/dist/ByteRenderer";

describe("displays the config correctly", () => {
    function testConfigRendering(cfg: HexViewerConfig) {
        const component = snapshotRenderer.create(<HexViewerConfigEditor config={cfg} setConfig={() => {}} />);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    }

    test("config with an address column", () => {
        testConfigRendering({lineWidth: 1, columns: [createAddressRendererConfig()]});
    });
    test("config with a text column", () => {
        testConfigRendering({lineWidth: 1, columns: [createTextRendererConfig()]});
    });
    test("config with a 1-byte column", () => {
        testConfigRendering({lineWidth: 1, columns: [createIntegerRendererConfig()]});
    });
    test("config with a 8-byte column", () => {
        testConfigRendering({lineWidth: 1, columns: [createIntegerRendererConfig({width: 8})]});
    });
    test("the default config", () => {
        testConfigRendering(defaultConfig);
    });
});

describe("can add columns", () => {
    function testAddConfig(cfg: HexViewerConfig, buttonLabel: string) {
        const cfgRef = {current: cfg};
        render(
            <HexViewerConfigEditor
                config={cfg}
                setConfig={cfg => {
                    cfgRef.current = cfg;
                }}
            />,
        );
        fireEvent.click(screen.getByText(/Add column/i));
        fireEvent.click(screen.getByText(new RegExp("Add " + buttonLabel, "i")));
        return cfgRef.current;
    }

    test("an Address renderer", () => {
        const newConfig = testAddConfig({lineWidth: 1, columns: []}, "Address Gutter");
        expect(newConfig.columns).toEqual([createAddressRendererConfig()]);
    });
    test("an ASCII renderer", () => {
        const newConfig = testAddConfig({lineWidth: 1, columns: []}, "Text");
        expect(newConfig.columns).toEqual([createTextRendererConfig()]);
    });
    test("an integer renderer", () => {
        const newConfig = testAddConfig({lineWidth: 1, columns: []}, "Integer");
        expect(newConfig.columns).toEqual([createIntegerRendererConfig({displayBase: 10})]);
    });
    test("a hexadecimal integer renderer", () => {
        const newConfig = testAddConfig({lineWidth: 1, columns: []}, "Hex");
        expect(newConfig.columns).toEqual([createIntegerRendererConfig({displayBase: 16})]);
    });

    test("appends the new renderer to preexisting renderers", () => {
        const newConfig = testAddConfig({lineWidth: 1, columns: [createAddressRendererConfig()]}, "Hex");
        expect(newConfig.columns).toEqual([
            createAddressRendererConfig(),
            createIntegerRendererConfig({displayBase: 16}),
        ]);
    });
});

describe("can remove columns", () => {
    function testRemoveConfig(cfg: HexViewerConfig, groupLabel: RegExp) {
        const cfgRef = {current: cfg};
        render(
            <HexViewerConfigEditor
                config={cfg}
                setConfig={cfg => {
                    cfgRef.current = cfg;
                }}
            />,
        );
        const group = screen.getByLabelText(groupLabel);
        const removeBtn = getByTitle(group, "Remove");
        fireEvent.click(removeBtn);
        return cfgRef.current;
    }

    test("the 1st column and 3rd column", () => {
        let cfg = defaultConfig;
        cfg = testRemoveConfig(cfg, /Address/i);
        expect(cfg.columns.length).toBe(2);
        expect(cfg.columns[0]).toBe(defaultConfig.columns[1]);
        expect(cfg.columns[1]).toBe(defaultConfig.columns[2]);
    });

    test("the 2nd column", () => {
        const cfg = defaultConfig;
        const newConfig = testRemoveConfig(cfg, /1-byte Hex/i);
        expect(newConfig.columns.length).toBe(2);
        expect(newConfig.columns[0]).toBe(cfg.columns[0]);
        expect(newConfig.columns[1]).toBe(cfg.columns[2]);
    });
});

describe("can reorder columns", () => {
    function testMove(cfg: HexViewerConfig, groupLabel: RegExp, buttonLabel: string) {
        const cfgRef = {current: cfg};
        render(
            <HexViewerConfigEditor
                config={cfg}
                setConfig={cfg => {
                    cfgRef.current = cfg;
                }}
            />,
        );
        const group = screen.getByLabelText(groupLabel);
        const button = getByTitle(group, buttonLabel);
        fireEvent.click(button);
        return cfgRef.current;
    }

    test("move up", () => {
        let cfg = defaultConfig;
        cfg = testMove(cfg, /1-byte Hex/i, "Move up");
        expect(cfg.columns.length).toBe(3);
        expect(cfg.columns[0]).toBe(defaultConfig.columns[1]);
        expect(cfg.columns[1]).toBe(defaultConfig.columns[0]);
        expect(cfg.columns[2]).toBe(defaultConfig.columns[2]);
    });

    test("move down", () => {
        let cfg = defaultConfig;
        cfg = testMove(cfg, /1-byte Hex/i, "Move down");
        expect(cfg.columns.length).toBe(3);
        expect(cfg.columns[0]).toBe(defaultConfig.columns[0]);
        expect(cfg.columns[1]).toBe(defaultConfig.columns[2]);
        expect(cfg.columns[2]).toBe(defaultConfig.columns[1]);
    });
});

describe("linewidth", () => {
    test("can change linewidth", () => {
        const cfgRef = {current: defaultConfig};
        render(
            <HexViewerConfigEditor
                config={cfgRef.current}
                setConfig={cfg => {
                    cfgRef.current = cfg;
                }}
            />,
        );
        const select = screen.getByLabelText(/line width/i);
        fireEvent.change(select, {target: {value: "13"}});
        expect(cfgRef.current.lineWidth).toBe(13);
        expect(cfgRef.current.columns).toBe(defaultConfig.columns);
    });

    test("can change linewidth only to valid values", () => {
        const cfgRef = {current: {lineWidth: 2, columns: [createIntegerRendererConfig({width: 2})]} as HexViewerConfig};
        render(
            <HexViewerConfigEditor
                config={cfgRef.current}
                setConfig={cfg => {
                    cfgRef.current = cfg;
                }}
            />,
        );
        const select = screen.getByLabelText(/line width/i);
        expect(queryByText(select, "1")).toBeNull();
        expect(queryByText(select, "2")).not.toBeNull();
        expect(queryByText(select, "3")).toBeNull();
        expect(queryByText(select, "4")).not.toBeNull();
    });

    test("adjusts linewidth with change of renderer", () => {
        const cfgRef = {current: {lineWidth: 5, columns: [createIntegerRendererConfig({width: 1})]} as HexViewerConfig};
        render(
            <HexViewerConfigEditor
                config={cfgRef.current}
                setConfig={cfg => {
                    cfgRef.current = cfg;
                }}
            />,
        );
        const buttonGroup = getByLabelText(screen.getByLabelText(/1-byte Hex/i), /^Width$/i);
        fireEvent.click(getByLabelText(buttonGroup, "4"));
        expect(cfgRef.current.lineWidth).toBe(8);
    });
});

function getLabel(e: HTMLInputElement) {
    if (e.labels == null) return "";
    if (e.labels.length != 1) return "";
    return getNodeText(e.labels[0]);
}

describe("can change AddressGutter config", () => {
    test("can change base for displayed addresses", () => {
        const initialCfg: HexViewerConfig = {lineWidth: 1, columns: [createAddressRendererConfig()]};
        const cfgRef = {current: initialCfg};
        render(
            <HexViewerConfigEditor
                config={initialCfg}
                setConfig={cfg => {
                    cfgRef.current = cfg;
                }}
            />,
        );
        const group = screen.getByLabelText(/Base/i);
        // Check that all options are available
        const options = getAllByRole(group, "radio") as HTMLInputElement[];
        expect(options.map(getLabel)).toEqual(["10", "16"]);
        // Check that a change is propagated
        expect((cfgRef.current.columns[0] as AddressRendererConfig).displayBase).not.toBe(10);
        fireEvent.click(getByLabelText(group, "10"));
        expect((cfgRef.current.columns[0] as AddressRendererConfig).displayBase).toBe(10);
    });
});

describe("can change Integer config", () => {
    function interactToggleButton(
        groupLabel: RegExp,
        expectedOptions: string[],
        optionLabel: string,
        k: keyof IntegerRendererConfig,
    ) {
        const initialCfg: HexViewerConfig = {lineWidth: 1, columns: [createIntegerRendererConfig()]};
        const cfgRef = {current: initialCfg};
        render(
            <HexViewerConfigEditor
                config={initialCfg}
                setConfig={cfg => {
                    cfgRef.current = cfg;
                }}
            />,
        );
        const group = screen.getByLabelText(groupLabel);
        // Check that all options are available
        const options = getAllByRole(group, "radio") as HTMLInputElement[];
        expect(options.map(getLabel)).toEqual(expectedOptions);
        // Check that a change is propagated
        const beforeValue = (cfgRef.current.columns[0] as IntegerRendererConfig)[k];
        fireEvent.click(getByLabelText(group, optionLabel));
        const afterValue = (cfgRef.current.columns[0] as IntegerRendererConfig)[k];
        expect(afterValue).not.toBe(beforeValue);
        return afterValue;
    }
    test("can change width", () => {
        const resultState = interactToggleButton(/^width/i, ["1", "2", "4", "8"], "4", "width");
        expect(resultState).toBe(4);
    });
    test("can change display base", () => {
        const resultState = interactToggleButton(/base/i, ["2", "8", "10", "16"], "8", "displayBase");
        expect(resultState).toBe(8);
    });
    test("can change endianess", () => {
        const resultState = interactToggleButton(/endianess/i, ["Little", "Big"], "Big", "littleEndian");
        expect(resultState).toBe(false);
    });
    test("can change signedness", () => {
        const resultState = interactToggleButton(/^sign$/i, ["Signed", "Unsigned"], "Signed", "signed");
        expect(resultState).toBe(true);
    });
    test("can change fixedWidth", () => {
        const resultState = interactToggleButton(/fixed width/i, ["Yes", "No"], "No", "fixedWidth");
        expect(resultState).toBe(false);
    });
});

describe("can change Text config", () => {
    test("can change encoding", () => {
        const initialCfg: HexViewerConfig = {lineWidth: 1, columns: [createTextRendererConfig()]};
        const cfgRef = {current: initialCfg};
        render(
            <HexViewerConfigEditor
                config={initialCfg}
                setConfig={cfg => {
                    cfgRef.current = cfg;
                }}
            />,
        );
        const select = screen.getByLabelText(/Encoding/i) as HTMLSelectElement;
        // Check that all options are available
        expect(Array.from(select.options).map(e => e.value)).toEqual([
            "ascii",
            "utf8",
            "utf16le",
            "utf16be",
            "utf32le",
            "utf32be",
        ]);
        // Check that a change is propagated
        expect((cfgRef.current.columns[0] as TextRendererConfig).encoding).not.toBe("utf8");
        fireEvent.change(select, {target: {value: "utf8"}});
        expect((cfgRef.current.columns[0] as TextRendererConfig).encoding).toBe("utf8");
    });
});
