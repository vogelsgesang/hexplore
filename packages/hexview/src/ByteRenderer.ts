import {assertUnreachable as assertExhausted} from "./util";

export enum RendererType {
    Address = "Address",
    Text = "Text",
    Integer = "Integer",
    Float = "Float",
}

export type AddressDisplayBase = 10 | 16;

export type IntegerDisplayBase = 2 | 8 | 10 | 16;

export interface RendererConfig {
    rendererType: RendererType;
}

export interface AddressRendererConfig extends RendererConfig {
    rendererType: RendererType.Address;
    displayBase: AddressDisplayBase;
}

export interface TextRendererConfig extends RendererConfig {
    rendererType: RendererType.Text;
    encoding: "ascii" | "utf8" | "utf16le" | "utf16be" | "utf32le" | "utf32be";
}

export interface IntegerRendererConfig extends RendererConfig {
    rendererType: RendererType.Integer;
    signed: boolean;
    width: 1 | 2 | 4 | 8;
    littleEndian: boolean;
    fixedWidth: boolean;
    displayBase: IntegerDisplayBase;
}

export interface FloatRendererConfig extends RendererConfig {
    rendererType: RendererType.Float;
    width: 4 | 8;
    littleEndian: boolean;
}

export function createAddressRendererConfig(c: Partial<AddressRendererConfig> = {}): AddressRendererConfig {
    const defaults = {
        rendererType: RendererType.Address,
        displayBase: 16,
    } as AddressRendererConfig;
    return {...defaults, ...c};
}

export function createTextRendererConfig(c: Partial<TextRendererConfig> = {}): TextRendererConfig {
    const defaults = {
        rendererType: RendererType.Text,
        encoding: "ascii",
    } as TextRendererConfig;
    return {...defaults, ...c};
}

export function createIntegerRendererConfig(c: Partial<IntegerRendererConfig> = {}): IntegerRendererConfig {
    const defaults = {
        rendererType: RendererType.Integer,
        displayBase: 16,
        width: 1,
        signed: false,
        littleEndian: true,
        fixedWidth: true,
    } as IntegerRendererConfig;
    return {...defaults, ...c};
}

export function createFloatRendererConfig(c: Partial<FloatRendererConfig> = {}): FloatRendererConfig {
    const defaults = {
        rendererType: RendererType.Float,
        width: 4,
        littleEndian: true,
    } as FloatRendererConfig;
    return {...defaults, ...c};
}

/**
 * Provides a human-redable name for the given renderer
 */
export function humanReadableRendererName(rendererConfig: RendererConfig): string {
    switch (rendererConfig.rendererType) {
        case RendererType.Address: {
            return "Address";
        }
        case RendererType.Text: {
            const c = rendererConfig as TextRendererConfig;
            switch (c.encoding) {
                case "ascii":
                    return "ASCII";
                case "utf8":
                    return "UTF-8";
                case "utf16le":
                    return "UTF-16 (LE)";
                case "utf16be":
                    return "UTF-16 (BE)";
                case "utf32be":
                    return "UTF-32 (BE)";
                case "utf32be":
                    return "UTF-32 (BE)";
            }
        }
        case RendererType.Integer: {
            const c = rendererConfig as IntegerRendererConfig;
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
        case RendererType.Float: {
            const c = rendererConfig as FloatRendererConfig;
            switch (c.width) {
                case 4:
                    return "Float";
                case 8:
                    return "Double";
            }
        }
    }
}

export function getAlignment(c: RendererConfig) {
    switch (c.rendererType) {
        case RendererType.Address:
            return 1;
        case RendererType.Text:
            const cc = c as TextRendererConfig;
            switch (cc.encoding) {
                case "ascii":
                    return 1;
                case "utf8":
                    return 1;
                case "utf16le":
                    return 2;
                case "utf16be":
                    return 2;
                case "utf32le":
                    return 4;
                case "utf32be":
                    return 4;
            }
        case RendererType.Integer:
            return (c as IntegerRendererConfig).width;
        case RendererType.Float:
            return (c as FloatRendererConfig).width;
    }
}

function charFromCodePoint(codepoint: number) {
    const isNonPrintable = codepoint < 0x20 || codepoint == 127;
    if (isNonPrintable) {
        return ".";
    } else if (codepoint > 0xd800 && codepoint <= 0xdfff) {
        return ".";
    } else {
        try {
            return String.fromCodePoint(codepoint);
        } catch (e) {
            return ".";
        }
    }
}

function readUtf8(data: DataView, idx: number) {
    if (idx + 1 > data.byteLength) return undefined;
    const byte1 = data.getUint8(idx);
    function isContinuationByte(b: number) {
        return (b & 0xc0) == 0x80;
    }
    if ((byte1 & 0x80) == 0) {
        // Single-byte character
        return byte1;
    } else if ((byte1 & 0xe0) == 0xc0) {
        // Two byte character
        if (idx + 2 > data.byteLength) return undefined;
        const byte2 = data.getUint8(idx + 1);
        if (!isContinuationByte(byte2)) return undefined;
        const codepoint = ((byte1 & 0x1f) << 6) | (byte2 & 0x3f);
        if (codepoint < 0x80) return undefined;
        return codepoint;
    } else if ((byte1 & 0xf0) == 0xe0) {
        // Three byte character
        if (idx + 3 > data.byteLength) return undefined;
        const byte2 = data.getUint8(idx + 1);
        const byte3 = data.getUint8(idx + 2);
        if (!isContinuationByte(byte2) || !isContinuationByte(byte3)) return undefined;
        const codepoint = ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f);
        if (codepoint < 0x800) return undefined;
        return codepoint;
    } else if ((byte1 & 0xf8) == 0xf0) {
        // Four byte character
        if (idx + 4 > data.byteLength) return undefined;
        const byte2 = data.getUint8(idx + 1);
        const byte3 = data.getUint8(idx + 2);
        const byte4 = data.getUint8(idx + 3);
        if (!isContinuationByte(byte2) || !isContinuationByte(byte3) || !isContinuationByte(byte4)) return undefined;
        const codepoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3f) << 12) | ((byte3 & 0x3f) << 6) | (byte4 & 0x3f);
        if (codepoint < 0x10000) return undefined;
        return codepoint;
    } else {
        // Invalid
        return undefined;
    }
}

function isContinuationStart(codepoint: number) {
    return (codepoint & 0xfc00) == 0xd800;
}

function isContinuationEnd(codepoint: number) {
    return (codepoint & 0xfc00) == 0xdc00;
}

function asciiRenderer(data: DataView, idx: number) {
    const byte = data.getUint8(idx);
    if (byte > 0x7f) return ".";
    return charFromCodePoint(byte);
}

function utf8Renderer(data: DataView, idx: number) {
    const codepoint = readUtf8(data, idx);
    if (codepoint == undefined) {
        return ".";
    } else {
        return charFromCodePoint(codepoint);
    }
}

function createUtf16Renderer(littleEndian: boolean) {
    return function utf16Renderer(data: DataView, idx: number) {
        if (idx + 2 > data.byteLength) return ".";
        const v1 = data.getUint16(idx, littleEndian);
        if (isContinuationStart(v1)) {
            if (idx + 4 > data.byteLength) return ".";
            const v2 = data.getUint16(idx + 2, littleEndian);
            if (!isContinuationEnd(v2)) return ".";
            const codepoint = 0x10000 + ((v1 & 0x3ff) << 10) + (v2 & 0x3ff);
            return charFromCodePoint(codepoint);
        } else if (isContinuationEnd(v1)) {
            return ".";
        } else {
            return charFromCodePoint(v1);
        }
    };
}

function createUtf32Renderer(littleEndian: boolean) {
    return function utf16Renderer(data: DataView, idx: number) {
        if (idx + 4 > data.byteLength) return ".";
        const codepoint = data.getUint32(idx, littleEndian);
        if (isContinuationStart(codepoint) || isContinuationEnd(codepoint)) {
            return ".";
        }
        return charFromCodePoint(codepoint);
    };
}

function formatInteger(v: number, base: number, width: number, signed: boolean) {
    let s = Math.abs(v)
        .toString(base)
        .padStart(width, "0");
    if (signed) {
        s = (v < 0 ? "-" : " ") + s;
    }
    return s;
}

function formatInteger64bit(low: number, high: number, base: number, width: number, signed: boolean) {
    const bit32 = 0x100000000;
    const negative = signed && high & 0x80000000;
    if (negative) {
        high = ~high;
        low = bit32 - low;
    }
    let s = "";
    while (high || low) {
        const mod = (high % base) * bit32 + low;
        high = Math.floor(high / base);
        low = Math.floor(mod / base);
        s = (mod % base).toString(base) + s;
    }
    s = s.padStart(width, "0");
    if (signed) {
        s = (negative ? "-" : " ") + s;
    }
    return s;
}

function createIntegerRenderer({width, signed, littleEndian, displayBase, fixedWidth}: IntegerRendererConfig) {
    let padWidth = 0;
    if (fixedWidth) {
        padWidth = Math.ceil((Math.log(1 << 8) / Math.log(displayBase)) * width);
    }

    return function intRenderer(data: DataView, idx: number): string {
        if (idx + width > data.byteLength) {
            return ".".repeat((signed ? 1 : 0) + padWidth);
        }
        if (width == 1) {
            const v = signed ? data.getInt8(idx) : data.getUint8(idx);
            return formatInteger(v, displayBase, padWidth, signed);
        } else if (width == 2) {
            const v = signed ? data.getInt16(idx, littleEndian) : data.getUint16(idx, littleEndian);
            return formatInteger(v, displayBase, padWidth, signed);
        } else if (width == 4) {
            const v = signed ? data.getInt32(idx, littleEndian) : data.getUint32(idx, littleEndian);
            return formatInteger(v, displayBase, padWidth, signed);
        } else if (width == 8) {
            let low, high;
            if (littleEndian) {
                low = data.getUint32(idx, true);
                high = data.getUint32(idx + 4, true);
            } else {
                low = data.getUint32(idx + 4, false);
                high = data.getUint32(idx, false);
            }
            return formatInteger64bit(low, high, displayBase, padWidth, signed);
        }
        assertExhausted(width);
    };
}

function createFloatRenderer({width, littleEndian}: FloatRendererConfig) {
    let maxStrWidth: number;
    switch (width) {
        case 4:
            maxStrWidth = 10;
            break;
        case 8:
            maxStrWidth = 18;
            break;
        default:
            assertExhausted(width);
    }

    return function floatRenderer(data: DataView, idx: number) {
        if (idx + width > data.byteLength) {
            return ".".repeat(maxStrWidth);
        }
        // Read the parts of the float
        let sign: boolean;
        let exponent: number;
        let mantissa: number;
        if (width === 4) {
            const raw = data.getUint32(idx, littleEndian);
            sign = raw >>> 31 == 1;
            const exponentRaw = (raw >>> 23) & 0xff;
            const fraction = raw & 0x7fffff;
            if (exponentRaw == 0xff) {
                if (fraction == 0) {
                    return sign ? "-Inf" : "+Inf";
                } else if (fraction & 0x400000) {
                    return "qNaN";
                } else {
                    return "sNaN";
                }
            } else if (exponentRaw == 0) {
                // Subnormal or zero
                const fractionLeadingZeros = Math.clz32(fraction) - 9;
                exponent = -127 - fractionLeadingZeros;
                mantissa = fraction * Math.pow(2, -22 + fractionLeadingZeros);
            } else {
                // Normal valuee
                exponent = exponentRaw - 127;
                mantissa = (fraction | 0x800000) * Math.pow(2, -23);
            }
        } else if (width === 8) {
            let raw1, raw2;
            if (littleEndian) {
                raw1 = data.getUint32(idx + 4, littleEndian);
                raw2 = data.getUint32(idx, littleEndian);
            } else {
                raw1 = data.getUint32(idx, littleEndian);
                raw2 = data.getUint32(idx + 4, littleEndian);
            }
            sign = raw1 >>> 31 == 1;
            const exponentRaw = (raw1 >>> 20) & 0x7ff;
            const fractionPart1 = raw1 & 0xfffff;
            const fraction = fractionPart1 * 0x100000000 + raw2;
            if (exponentRaw == 0x7ff) {
                if (fraction == 0) {
                    return sign ? "-Inf" : "+Inf";
                } else if (fractionPart1 & 0x80000) {
                    return "qNaN";
                } else {
                    return "sNaN";
                }
            } else if (exponentRaw == 0) {
                // Subnormal or zero
                let fractionLeadingZeros = Math.clz32(fractionPart1) - 12;
                if (fractionLeadingZeros == 20) {
                    fractionLeadingZeros += Math.clz32(raw2);
                }
                exponent = -1023 - fractionLeadingZeros;
                mantissa = fraction * Math.pow(2, -51 + fractionLeadingZeros);
            } else {
                // Normal valuee
                exponent = exponentRaw - 1023;
                mantissa = (fraction + 0x10000000000000) * Math.pow(2, -52);
            }
        } else {
            assertExhausted(width);
        }
        // Format the float value
        if (mantissa == 0) {
            return (sign ? "-0." : "+0.").padEnd(maxStrWidth, "0");
        }
        const exponent10Raw = (exponent * Math.LOG10E) / Math.LOG2E;
        const exponent10 = Math.floor(exponent10Raw + Math.log10(mantissa));
        const mantissa10 = mantissa * Math.pow(10, exponent10Raw - exponent10);
        const expStr = exponent10 ? "e" + exponent10.toString() : "";
        const mantissaStr = mantissa10.toPrecision(maxStrWidth - expStr.length - 2);
        return (sign ? "-" : "+") + mantissaStr + expStr;
    };
}

function createAddressRenderer(base: AddressDisplayBase) {
    return function addressRenderer(_data: DataView, idx: number): string {
        switch (base) {
            case 10: {
                return idx.toString(10);
            }
            case 16: {
                return "0x" + idx.toString(16);
            }
        }
    };
}

export function createRenderer(config: RendererConfig) {
    switch (config.rendererType) {
        case RendererType.Address: {
            const cc = config as AddressRendererConfig;
            return createAddressRenderer(cc.displayBase);
        }
        case RendererType.Text: {
            const cc = config as TextRendererConfig;
            switch (cc.encoding) {
                case "ascii":
                    return asciiRenderer;
                case "utf8":
                    return utf8Renderer;
                case "utf16le":
                    return createUtf16Renderer(true);
                case "utf16be":
                    return createUtf16Renderer(false);
                case "utf32le":
                    return createUtf32Renderer(true);
                case "utf32be":
                    return createUtf32Renderer(false);
            }
        }
        case RendererType.Integer: {
            return createIntegerRenderer(config as IntegerRendererConfig);
        }
        case RendererType.Float: {
            return createFloatRenderer(config as FloatRendererConfig);
        }
        default:
            assertExhausted(config.rendererType);
    }
}

export function createStridedRenderer(config: RendererConfig, strideSize: number) {
    const renderer = createRenderer(config);
    return (data: DataView, idx: number) => renderer(data, idx * strideSize);
}
