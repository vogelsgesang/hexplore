import {createRenderer, createStridedRenderer} from "./ByteRenderer";
import {ColumnType, AddressGutterConfig, AsciiColumnConfig, IntegerColumnConfig} from "./HexViewerConfig";

function constView(bytes: number[]) {
    const buf = new ArrayBuffer(bytes.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, len = bytes.length; i < len; i++) {
        bufView[i] = bytes[i];
    }
    return new DataView(buf);
}

describe("The Address renderer", () => {
    const dummyView = constView([]);
    test("supports decimal", () => {
        const addressColumnType = {columnType: ColumnType.AddressGutter, displayBase: 10} as AddressGutterConfig;
        const renderer = createRenderer(addressColumnType);
        expect(renderer(dummyView, 0)).toBe("0");
        expect(renderer(dummyView, 10)).toBe("10");
        expect(renderer(dummyView, 15)).toBe("15");
        expect(renderer(dummyView, 99)).toBe("99");
        expect(renderer(dummyView, 100)).toBe("100");
    });
    test("supports hexadecimal", () => {
        const addressColumnType = {columnType: ColumnType.AddressGutter, displayBase: 16} as AddressGutterConfig;
        const renderer = createRenderer(addressColumnType);
        expect(renderer(dummyView, 0)).toBe("0x0");
        expect(renderer(dummyView, 10)).toBe("0xa");
        expect(renderer(dummyView, 15)).toBe("0xf");
        expect(renderer(dummyView, 16)).toBe("0x10");
        expect(renderer(dummyView, 255)).toBe("0xff");
        expect(renderer(dummyView, 256)).toBe("0x100");
    });
});

describe("The ASCII renderer", () => {
    const addressColumnType = {columnType: ColumnType.AsciiColumn} as AsciiColumnConfig;
    const renderer = createRenderer(addressColumnType);
    test("renders ASCII characters", () => {
        expect(renderer(constView([32]), 0)).toBe(" ");
        expect(renderer(constView([49]), 0)).toBe("1");
        expect(renderer(constView([64]), 0)).toBe("@");
        expect(renderer(constView([109]), 0)).toBe("m");
        expect(renderer(constView([126]), 0)).toBe("~");
    });
    test("renders control characters as dot", () => {
        expect(renderer(constView([0]), 0)).toBe(".");
        expect(renderer(constView([19]), 0)).toBe(".");
        expect(renderer(constView([128]), 0)).toBe(".");
    });
    test("renders invalid characters as dot", () => {
        expect(renderer(constView([134]), 0)).toBe(".");
        expect(renderer(constView([255]), 0)).toBe(".");
    });
});

describe("The integer renderer", () => {
    function createIntRendererWithDefaults(c : Partial<IntegerColumnConfig>) {
        const defaults = {
            columnType: ColumnType.IntegerColumn,
            displayBase: 16,
            width: 1,
            signed: false,
            littleEndian: true,
        } as IntegerColumnConfig;
        return createRenderer({...defaults, ...c});
    }

    describe("supports binary formatting", () => {
        const renderer = createIntRendererWithDefaults({displayBase: 2});
        expect(renderer(constView([0]), 0)).toBe("00000000");
        expect(renderer(constView([1]), 0)).toBe("00000001");
        expect(renderer(constView([78]), 0)).toBe("01001110");
        expect(renderer(constView([178]), 0)).toBe("10110010");
        expect(renderer(constView([255]), 0)).toBe("11111111");
    });
    describe("supports octal formatting", () => {
        const renderer = createIntRendererWithDefaults({displayBase: 8});
        expect(renderer(constView([0]), 0)).toBe("000");
        expect(renderer(constView([1]), 0)).toBe("001");
        expect(renderer(constView([78]), 0)).toBe("116");
        expect(renderer(constView([178]), 0)).toBe("262");
        expect(renderer(constView([255]), 0)).toBe("377");
    });
    describe("supports decimal formatting", () => {
        const renderer = createIntRendererWithDefaults({displayBase: 10});
        expect(renderer(constView([0]), 0)).toBe("000");
        expect(renderer(constView([1]), 0)).toBe("001");
        expect(renderer(constView([78]), 0)).toBe("078");
        expect(renderer(constView([178]), 0)).toBe("178");
        expect(renderer(constView([255]), 0)).toBe("255");
    });
    describe("supports hexadecimal formatting", () => {
        const renderer = createIntRendererWithDefaults({displayBase: 16});
        expect(renderer(constView([0]), 0)).toBe("00");
        expect(renderer(constView([1]), 0)).toBe("01");
        expect(renderer(constView([78]), 0)).toBe("4e");
        expect(renderer(constView([178]), 0)).toBe("b2");
        expect(renderer(constView([255]), 0)).toBe("ff");
    });
    describe("supports signed integers, also non-decimal", () => {
        const renderer = createIntRendererWithDefaults({displayBase: 16, signed: true});
        expect(renderer(constView([0]), 0)).toBe(" 00");
        expect(renderer(constView([1]), 0)).toBe(" 01");
        expect(renderer(constView([78]), 0)).toBe(" 4e");
        expect(renderer(constView([178]), 0)).toBe("-4e");
        expect(renderer(constView([255]), 0)).toBe("-01");
    });
    describe("supports multi-byte integers", () => {
        const renderer = createIntRendererWithDefaults({width: 2});
        expect(renderer(constView([0, 1]), 0)).toBe("0100");
        expect(renderer(constView([1, 255]), 0)).toBe("ff01");
        expect(renderer(constView([255, 1]), 0)).toBe("01ff");
        expect(renderer(constView([178, 3]), 0)).toBe("03b2");
    });
    describe("supports big-endian", () => {
        const renderer = createIntRendererWithDefaults({width: 2, littleEndian: false});
        expect(renderer(constView([0, 1]), 0)).toBe("0001");
        expect(renderer(constView([1, 255]), 0)).toBe("01ff");
        expect(renderer(constView([255, 1]), 0)).toBe("ff01");
        expect(renderer(constView([178, 3]), 0)).toBe("b203");
    });
    describe("handles truncated values", () => {
        const renderer = createIntRendererWithDefaults({width: 2});
        expect(renderer(constView([0, 1, 2]), 0)).toBe("0100");
        expect(renderer(constView([0, 1, 2]), 1)).toBe("0201");
        expect(renderer(constView([0, 1, 2]), 2)).toBe("....");
    });
});

describe("createStridedRenderer", () => {
    test("works for Adress columns", () => {
        const dummyView = constView([]);
        const addressColumnType = {columnType: ColumnType.AddressGutter, displayBase: 16} as AddressGutterConfig;
        const renderer = createStridedRenderer(addressColumnType, 32);
        expect(renderer(dummyView, 0)).toBe("0x0");
        expect(renderer(dummyView, 1)).toBe("0x20");
        expect(renderer(dummyView, 2)).toBe("0x40");
    });
    test("works for integer columns", () => {
        const data = constView([1, 2, 0xff, 0xcc]);
        const columnType = {
            columnType: ColumnType.IntegerColumn,
            displayBase: 16,
            width: 2,
            signed: false,
            littleEndian: true,
        } as IntegerColumnConfig;
        const renderer = createStridedRenderer(columnType, 2);
        expect(renderer(data, 0)).toBe("0201");
        expect(renderer(data, 1)).toBe("ccff");
    });
});
