import {
    createRenderer,
    createStridedRenderer,
    createIntegerRendererConfig,
    createAddressRendererConfig,
    IntegerRendererConfig,
    createTextRendererConfig,
    createFloatRendererConfig,
} from "./ByteRenderer";

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
        const addressColumnType = createAddressRendererConfig({displayBase: 10});
        const renderer = createRenderer(addressColumnType);
        expect(renderer(dummyView, 0)).toBe("0");
        expect(renderer(dummyView, 10)).toBe("10");
        expect(renderer(dummyView, 15)).toBe("15");
        expect(renderer(dummyView, 99)).toBe("99");
        expect(renderer(dummyView, 100)).toBe("100");
    });
    test("supports hexadecimal", () => {
        const addressColumnType = createAddressRendererConfig({displayBase: 16});
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
    const textRendererConfig = createTextRendererConfig({encoding: "ascii"});
    const renderer = createRenderer(textRendererConfig);
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
        expect(renderer(constView([127]), 0)).toBe(".");
        expect(renderer(constView([128]), 0)).toBe(".");
    });
    test("renders invalid characters as dot", () => {
        expect(renderer(constView([134]), 0)).toBe(".");
        expect(renderer(constView([255]), 0)).toBe(".");
    });
});

describe("The UTF-8 renderer", () => {
    const textRendererConfig = createTextRendererConfig({encoding: "utf8"});
    const renderer = createRenderer(textRendererConfig);
    test("renders ASCII characters", () => {
        expect(renderer(constView([32]), 0)).toBe(" ");
        expect(renderer(constView([49]), 0)).toBe("1");
        expect(renderer(constView([64]), 0)).toBe("@");
        expect(renderer(constView([109]), 0)).toBe("m");
        expect(renderer(constView([126]), 0)).toBe("~");
    });
    test("renders control characters as dot", () => {
        expect(renderer(constView([134]), 0)).toBe(".");
        expect(renderer(constView([255]), 0)).toBe(".");
    });
    test("renders 2-byte encoded characters", () => {
        expect(renderer(constView([194, 187]), 0)).toBe("»");
        expect(renderer(constView([210, 150]), 0)).toBe("Җ");
        expect(renderer(constView([195, 183]), 0)).toBe("÷");
    });
    test("renders 3-byte encoded characters", () => {
        expect(renderer(constView([226, 128, 158]), 0)).toBe("„");
        expect(renderer(constView([226, 157, 175]), 0)).toBe("❯");
        expect(renderer(constView([225, 142, 175]), 0)).toBe("Ꭿ");
        expect(renderer(constView([226, 130, 179]), 0)).toBe("₳");
        expect(renderer(constView([225, 151, 169]), 0)).toBe("ᗩ");
        expect(renderer(constView([225, 131, 179]), 0)).toBe("ჳ");
        expect(renderer(constView([226, 152, 168]), 0)).toBe("☨");
        expect(renderer(constView([226, 153, 176]), 0)).toBe("♰");
        expect(renderer(constView([226, 156, 153]), 0)).toBe("✙");
        expect(renderer(constView([226, 157, 150]), 0)).toBe("❖");
        expect(renderer(constView([226, 168, 179]), 0)).toBe("⨳");
        expect(renderer(constView([226, 157, 130]), 0)).toBe("❂");
        expect(renderer(constView([226, 168, 187]), 0)).toBe("⨻");
        expect(renderer(constView([226, 153, 187]), 0)).toBe("♻");
        expect(renderer(constView([226, 153, 152]), 0)).toBe("♘");
        expect(renderer(constView([226, 154, 156]), 0)).toBe("⚜");
    });
    test("renders 4-byte encoded characters", () => {
        expect(renderer(constView([240, 159, 152, 130]), 0)).toBe("😂");
        expect(renderer(constView([240, 159, 152, 129]), 0)).toBe("😁");
        expect(renderer(constView([240, 159, 140, 185]), 0)).toBe("🌹");
        expect(renderer(constView([240, 159, 140, 187]), 0)).toBe("🌻");
    });
    test("renders continuation chars as dot", () => {
        // low continuation point (0xD801)
        expect(renderer(constView([0xed, 0xa0, 0x81]), 0)).toBe(".");
        // high continuation point (0xDC00)
        expect(renderer(constView([0xed, 0xb0, 0x80]), 0)).toBe(".");
    });
    test("renders truncated characters as dot", () => {
        // A single continuation byte
        expect(renderer(constView([194]), 0)).toBe(".");
        // Should be 2 bytes, but is only 1
        expect(renderer(constView([129]), 0)).toBe(".");
        // should be 3 bytes, but is only 2
        expect(renderer(constView([226, 128]), 0)).toBe(".");
        // should be 4 bytes, but is only 3
        expect(renderer(constView([240, 159, 152]), 0)).toBe(".");
    });
});

describe("The UTF-16 renderer", () => {
    const rendererLE = createRenderer(createTextRendererConfig({encoding: "utf16le"}));
    const rendererBE = createRenderer(createTextRendererConfig({encoding: "utf16be"}));
    test("renders ASCII characters", () => {
        expect(rendererLE(constView([32, 0]), 0)).toBe(" ");
        expect(rendererLE(constView([49, 0]), 0)).toBe("1");
        expect(rendererLE(constView([64, 0]), 0)).toBe("@");
        expect(rendererLE(constView([109, 0]), 0)).toBe("m");
        expect(rendererLE(constView([126, 0]), 0)).toBe("~");
    });
    test("renders characters from Extended-A", () => {
        // It would be tempting to rejet those characters, as they are not valid in ASCII, but they are in UTF-16
        expect(rendererLE(constView([169, 0]), 0)).toBe("©");
        expect(rendererLE(constView([191, 0]), 0)).toBe("¿");
    });
    test("renders single char-code", () => {
        expect(rendererLE(constView([187, 0]), 0)).toBe("»");
        expect(rendererLE(constView([150, 4]), 0)).toBe("Җ");
        expect(rendererLE(constView([247, 0]), 0)).toBe("÷");
        expect(rendererLE(constView([111, 39]), 0)).toBe("❯");
        expect(rendererLE(constView([51, 42]), 0)).toBe("⨳");
        expect(rendererLE(constView([3, 34]), 0)).toBe("∃");
        expect(rendererLE(constView([0, 34]), 0)).toBe("∀");
        expect(rendererLE(constView([88, 38]), 0)).toBe("♘");
    });
    test("renders combined characters", () => {
        expect(rendererLE(constView([61, 216, 1, 222]), 0)).toBe("😁");
        expect(rendererLE(constView([60, 216, 57, 223]), 0)).toBe("🌹");
        expect(rendererLE(constView([60, 216, 59, 223]), 0)).toBe("🌻");
    });
    test("renders continuation chars as dot", () => {
        // low continuation point
        expect(rendererLE(constView([61, 216]), 0)).toBe(".");
        // high continuation point
        expect(rendererLE(constView([1, 222]), 0)).toBe(".");
    });
    test("renders truncated characters as dot", () => {
        // Incomplete 16-Byte
        expect(rendererLE(constView([61]), 0)).toBe(".");
        // Starts with continuation, but continuation is truncated
        expect(rendererLE(constView([61, 216, 1]), 0)).toBe(".");
        // Starts with continuation, but followed by normal character is
        expect(rendererLE(constView([61, 216, 88, 38]), 0)).toBe(".");
    });
    test("can also render big-endian", () => {
        expect(rendererBE(constView([0, 64]), 0)).toBe("@");
        expect(rendererBE(constView([38, 88]), 0)).toBe("♘");
        expect(rendererBE(constView([216, 60, 223, 57]), 0)).toBe("🌹");
        expect(rendererBE(constView([216, 60, 223, 59]), 0)).toBe("🌻");
    });
});

describe("The UTF-32 renderer", () => {
    const rendererLE = createRenderer(createTextRendererConfig({encoding: "utf32le"}));
    const rendererBE = createRenderer(createTextRendererConfig({encoding: "utf32be"}));
    test("renders ASCII characters", () => {
        expect(rendererLE(constView([32, 0, 0, 0]), 0)).toBe(" ");
        expect(rendererLE(constView([49, 0, 0, 0]), 0)).toBe("1");
        expect(rendererLE(constView([64, 0, 0, 0]), 0)).toBe("@");
        expect(rendererLE(constView([109, 0, 0, 0]), 0)).toBe("m");
        expect(rendererLE(constView([126, 0, 0, 0]), 0)).toBe("~");
    });
    test("renders characters from Extended-A", () => {
        // It would be tempting to rejet those characters, as they are not valid in ASCII, but they are in UTF-16
        expect(rendererLE(constView([169, 0, 0, 0]), 0)).toBe("©");
        expect(rendererLE(constView([191, 0, 0, 0]), 0)).toBe("¿");
    });
    test("renders single char-code", () => {
        expect(rendererLE(constView([187, 0, 0, 0]), 0)).toBe("»");
        expect(rendererLE(constView([150, 4, 0, 0]), 0)).toBe("Җ");
        expect(rendererLE(constView([247, 0, 0, 0]), 0)).toBe("÷");
        expect(rendererLE(constView([111, 39, 0, 0]), 0)).toBe("❯");
        expect(rendererLE(constView([51, 42, 0, 0]), 0)).toBe("⨳");
        expect(rendererLE(constView([3, 34, 0, 0]), 0)).toBe("∃");
        expect(rendererLE(constView([0, 34, 0, 0]), 0)).toBe("∀");
        expect(rendererLE(constView([88, 38, 0, 0]), 0)).toBe("♘");
    });
    test("renders 3-byte characters", () => {
        expect(rendererLE(constView([1, 246, 1, 0]), 0)).toBe("😁");
        expect(rendererLE(constView([57, 243, 1, 0]), 0)).toBe("🌹");
        expect(rendererLE(constView([59, 243, 1, 0]), 0)).toBe("🌻");
    });
    test("renders continuation chars as dot", () => {
        // low continuation point
        expect(rendererLE(constView([61, 216, 0, 0]), 0)).toBe(".");
        // high continuation point
        expect(rendererLE(constView([1, 222, 0, 0]), 0)).toBe(".");
    });
    test("renders truncated characters as dot", () => {
        expect(rendererLE(constView([88]), 0)).toBe(".");
        expect(rendererLE(constView([88, 38]), 0)).toBe(".");
        expect(rendererLE(constView([88, 38, 0]), 0)).toBe(".");
    });
    test("can also render big-endian", () => {
        expect(rendererBE(constView([0, 0, 0, 64]), 0)).toBe("@");
        expect(rendererBE(constView([0, 0, 38, 88]), 0)).toBe("♘");
        expect(rendererBE(constView([0, 1, 243, 57]), 0)).toBe("🌹");
        expect(rendererBE(constView([0, 1, 243, 59]), 0)).toBe("🌻");
    });
});

describe("The integer renderer", () => {
    function createIntRenderer(c: Partial<IntegerRendererConfig>) {
        return createRenderer(createIntegerRendererConfig(c));
    }

    describe("supports binary formatting", () => {
        const renderer = createIntRenderer({displayBase: 2});
        expect(renderer(constView([0]), 0)).toBe("00000000");
        expect(renderer(constView([1]), 0)).toBe("00000001");
        expect(renderer(constView([78]), 0)).toBe("01001110");
        expect(renderer(constView([178]), 0)).toBe("10110010");
        expect(renderer(constView([255]), 0)).toBe("11111111");
    });
    describe("supports octal formatting", () => {
        const renderer = createIntRenderer({displayBase: 8});
        expect(renderer(constView([0]), 0)).toBe("000");
        expect(renderer(constView([1]), 0)).toBe("001");
        expect(renderer(constView([78]), 0)).toBe("116");
        expect(renderer(constView([178]), 0)).toBe("262");
        expect(renderer(constView([255]), 0)).toBe("377");
    });
    describe("supports decimal formatting", () => {
        const renderer = createIntRenderer({displayBase: 10});
        expect(renderer(constView([0]), 0)).toBe("000");
        expect(renderer(constView([1]), 0)).toBe("001");
        expect(renderer(constView([78]), 0)).toBe("078");
        expect(renderer(constView([178]), 0)).toBe("178");
        expect(renderer(constView([255]), 0)).toBe("255");
    });
    describe("supports hexadecimal formatting", () => {
        const renderer = createIntRenderer({displayBase: 16});
        expect(renderer(constView([0]), 0)).toBe("00");
        expect(renderer(constView([1]), 0)).toBe("01");
        expect(renderer(constView([78]), 0)).toBe("4e");
        expect(renderer(constView([178]), 0)).toBe("b2");
        expect(renderer(constView([255]), 0)).toBe("ff");
    });
    describe("supports signed integers, also non-decimal", () => {
        const renderer = createIntRenderer({displayBase: 16, signed: true});
        expect(renderer(constView([0]), 0)).toBe(" 00");
        expect(renderer(constView([1]), 0)).toBe(" 01");
        expect(renderer(constView([78]), 0)).toBe(" 4e");
        expect(renderer(constView([178]), 0)).toBe("-4e");
        expect(renderer(constView([255]), 0)).toBe("-01");
    });
    describe("supports multi-byte integers", () => {
        const renderer = createIntRenderer({width: 2});
        expect(renderer(constView([0, 1]), 0)).toBe("0100");
        expect(renderer(constView([1, 255]), 0)).toBe("ff01");
        expect(renderer(constView([255, 1]), 0)).toBe("01ff");
        expect(renderer(constView([178, 3]), 0)).toBe("03b2");
    });
    describe("supports big-endian", () => {
        const renderer = createIntRenderer({width: 2, littleEndian: false});
        expect(renderer(constView([0, 1]), 0)).toBe("0001");
        expect(renderer(constView([1, 255]), 0)).toBe("01ff");
        expect(renderer(constView([255, 1]), 0)).toBe("ff01");
        expect(renderer(constView([178, 3]), 0)).toBe("b203");
    });
    describe("handles truncated values", () => {
        const renderer = createIntRenderer({width: 2});
        expect(renderer(constView([0, 1, 2]), 0)).toBe("0100");
        expect(renderer(constView([0, 1, 2]), 1)).toBe("0201");
        expect(renderer(constView([0, 1, 2]), 2)).toBe("....");
    });
    describe("supports 64-bit integers", () => {
        const renderer = createIntRenderer({width: 8});
        const rendererDec = createIntRenderer({width: 8, displayBase: 10});
        expect(renderer(constView([0, 1, 2, 128, 255, 5, 6, 7]), 0)).toBe("070605ff80020100");
        expect(rendererDec(constView([0, 1, 2, 128, 255, 5, 6, 7]), 0)).toBe("00506098603048173824");
    });
    describe("supports variable-width rendering", () => {
        const renderer = createIntRenderer({width: 2, fixedWidth: false});
        expect(renderer(constView([0, 1]), 0)).toBe("100");
        expect(renderer(constView([13, 0]), 0)).toBe("d");
    });
    describe("renders 8-byte zero also for variable-width", () => {
        const rendererDec = createIntRenderer({width: 8, displayBase: 10, fixedWidth: false});
        expect(rendererDec(constView([0, 0, 0, 0, 0, 0, 0, 0]), 0)).toBe("0");
    });
});

describe("The 4-byte float renderer", () => {
    const leRenderer = createRenderer(createFloatRendererConfig({width: 4, littleEndian: true}));
    const beRenderer = createRenderer(createFloatRendererConfig({width: 4, littleEndian: false}));

    test.each([
        [1, "+1.0000000"],
        [1.5, "+1.5000000"],
        [4, "+4.0000000"],
        [16, "+1.60000e1"],
        [99, "+9.90000e1"],
        [-123, "-1.23000e2"],
        [0.123, "+1.2300e-1"],
    ])("renders ordinary number %f", (i, str) => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer, 0);
        view.setFloat32(0, i, true);
        view.setFloat32(4, i, false);
        expect(leRenderer(view, 0)).toBe(str);
        expect(beRenderer(view, 4)).toBe(str);
    });

    test.each([
        ["smallest number > 1", [0x3f, 0x80, 0x00, 0x01], "+1.0000001"],
        ["min subnormal", [0x00, 0x00, 0x00, 0x01], "+1.401e-45"],
        ["max subnormal", [0x00, 0x7f, 0xff, 0xff], "+1.175e-38"],
        ["min normal number", [0x00, 0x80, 0x00, 0x00], "+1.175e-38"],
        ["max normal number", [0x7f, 0x7f, 0xff, 0xff], "+3.4028e38"],
        ["positive zero", [0x00, 0x00, 0x00, 0x00], "+0.0000000"],
        ["negative zero", [0x80, 0x00, 0x00, 0x00], "-0.0000000"],
        ["positive infinity", [0x7f, 0x80, 0x00, 0x00], "+Inf"],
        ["negative infinity", [0xff, 0x80, 0x00, 0x00], "-Inf"],
        ["signalling NaN", [0x7f, 0x80, 0x00, 0x01], "sNaN"],
        ["signalling NaN with payload", [0x7f, 0x8a, 0xbc, 0xde], "sNaN"],
        ["quiet NaN", [0x7f, 0xc0, 0x00, 0x01], "qNaN"],
        ["quiet NaN with sign", [0xff, 0xc0, 0x00, 0x01], "qNaN"],
    ])("renders %s", (_name, data, expected) => {
        expect(beRenderer(constView(data), 0)).toBe(expected);
        expect(leRenderer(constView(data.reverse()), 0)).toBe(expected);
    });

    describe("handles truncated values", () => {
        const view = constView([0x80, 0x00, 0x00, 0x00, 0x00]);
        expect(beRenderer(view, 0)).toBe("-0.0000000");
        expect(beRenderer(view, 1)).toBe("+0.0000000");
        expect(beRenderer(view, 2)).toBe("..........");
    });
});

describe("The 8-byte float renderer", () => {
    const leRenderer = createRenderer(createFloatRendererConfig({width: 8, littleEndian: true}));
    const beRenderer = createRenderer(createFloatRendererConfig({width: 8, littleEndian: false}));

    test.each([
        [1, "+1.000000000000000"],
        [1.5, "+1.500000000000000"],
        [4, "+4.000000000000000"],
        [16, "+1.6000000000000e1"],
        [99, "+9.9000000000000e1"],
        [-123, "-1.2300000000000e2"],
        [0.123, "+1.230000000000e-1"],
    ])("renders ordinary number %f", (i, str) => {
        const buffer = new ArrayBuffer(16);
        const view = new DataView(buffer, 0);
        view.setFloat64(0, i, true);
        view.setFloat64(8, i, false);
        expect(leRenderer(view, 0)).toBe(str);
        expect(beRenderer(view, 8)).toBe(str);
    });

    test.each([
        ["smallest number > 1", [0x3f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], "+1.000000000000000"],
        ["min subnormal", [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], "+4.9406564584e-324"],
        ["max subnormal", [0x00, 0x0f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff], "+2.2250738585e-308"],
        ["min normal number", [0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], "+2.2250738585e-308"],
        ["max normal number", [0x7f, 0xef, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff], "+1.79769313486e308"],
        ["positive zero", [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], "+0.000000000000000"],
        ["negative zero", [0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], "-0.000000000000000"],
        ["positive infinity", [0x7f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], "+Inf"],
        ["negative infinity", [0xff, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], "-Inf"],
        ["signalling NaN", [0x7f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], "sNaN"],
        ["signalling NaN with payload", [0x7f, 0xf0, 0x12, 0x00, 0xab, 0x00, 0x00, 0x00], "sNaN"],
        ["quiet NaN", [0x7f, 0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], "qNaN"],
        ["quiet NaN with sign", [0xff, 0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], "qNaN"],
    ])("renders %s", (_name, data, expected) => {
        expect(beRenderer(constView(data), 0)).toBe(expected);
        expect(leRenderer(constView(data.reverse()), 0)).toBe(expected);
    });

    describe("handles truncated values", () => {
        const view = constView([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        expect(beRenderer(view, 0)).toBe("-0.000000000000000");
        expect(beRenderer(view, 1)).toBe("+0.000000000000000");
        expect(beRenderer(view, 2)).toBe("..................");
    });
});

describe("createStridedRenderer", () => {
    test("works for Adress columns", () => {
        const dummyView = constView([]);
        const addressColumnType = createAddressRendererConfig();
        const renderer = createStridedRenderer(addressColumnType, 32);
        expect(renderer(dummyView, 0)).toBe("0x0");
        expect(renderer(dummyView, 1)).toBe("0x20");
        expect(renderer(dummyView, 2)).toBe("0x40");
    });
    test("works for integer columns", () => {
        const data = constView([1, 2, 0xff, 0xcc]);
        const columnType = createIntegerRendererConfig({width: 2});
        const renderer = createStridedRenderer(columnType, 2);
        expect(renderer(data, 0)).toBe("0201");
        expect(renderer(data, 1)).toBe("ccff");
    });
});
