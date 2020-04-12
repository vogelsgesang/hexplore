import {assertUnreachable as assertExhausted} from "./util";


export enum RendererType {
    Address = "Address",
    Ascii = "Ascii",
    Integer = "Integer",
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

export interface AsciiRendererConfig extends RendererConfig {
    rendererType: RendererType.Ascii;
}

export interface IntegerRendererConfig extends RendererConfig {
    rendererType: RendererType.Integer;
    signed: boolean;
    width: 1 | 2 | 4 | 8;
    littleEndian: boolean;
    displayBase: IntegerDisplayBase;
}

export function createAddressRendererConfig(c: Partial<AddressRendererConfig> = {}) : AddressRendererConfig {
    const defaults = {
        rendererType: RendererType.Address,
        displayBase: 16,
    } as AddressRendererConfig;
    return {...defaults, ...c};
}

export function createAsciiRendererConfig(c: Partial<AsciiRendererConfig> = {}) : AsciiRendererConfig {
    const defaults = {
        rendererType: RendererType.Ascii,
    } as AsciiRendererConfig;
    return {...defaults, ...c};
}

export function createIntegerRendererConfig(c: Partial<IntegerRendererConfig> = {}) :IntegerRendererConfig {
    const defaults = {
        rendererType: RendererType.Integer,
        displayBase: 16,
        width: 1,
        signed: false,
        littleEndian: true,
    } as IntegerRendererConfig;
    return {...defaults, ...c};
}


/**
 * Provides a human-redable name for the given renderer
 */
export function humanReadableRendererName(rendererConfig: RendererConfig) {
    switch (rendererConfig.rendererType) {
        case RendererType.Address: {
            return "Address";
        }
        case RendererType.Ascii: {
            return "ASCII";
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
    }
}

export function getAlignment(c: RendererConfig) {
    switch (c.rendererType) {
        case RendererType.Address:
            return 1;
        case RendererType.Ascii:
            return 1;
        case RendererType.Integer:
            return (c as IntegerRendererConfig).width;
    }
}

function byteAsAscii(data: DataView, idx: number) {
    const byte = data.getUint8(idx);
    // prettier-ignore
    const asciiTable = [" ", "!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~"];
    const isPrintable = byte >= 0x20 && byte < 127;
    if (isPrintable) {
        return asciiTable[byte - 0x20];
    } else {
        return ".";
    }
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

function createIntegerRenderer(width: 1 | 2 | 4 | 8, signed: boolean, littleEndian: boolean, base: IntegerDisplayBase) {
    const strWidth = Math.ceil((Math.log(1 << 8) / Math.log(base)) * width);

    return function intRenderer(data: DataView, idx: number): string {
        if (idx + width > data.byteLength) {
            return ".".repeat((signed ? 1 : 0) + strWidth);
        }
        if (width == 1) {
            const v = signed ? data.getInt8(idx) : data.getUint8(idx);
            return formatInteger(v, base, strWidth, signed);
        } else if (width == 2) {
            const v = signed ? data.getInt16(idx, littleEndian) : data.getUint16(idx, littleEndian);
            return formatInteger(v, base, strWidth, signed);
        } else if (width == 4) {
            const v = signed ? data.getInt32(idx, littleEndian) : data.getUint32(idx, littleEndian);
            return formatInteger(v, base, strWidth, signed);
        } else if (width == 8) {
            let low, high;
            if (littleEndian) {
                low = data.getUint32(idx, true);
                high = data.getUint32(idx + 4, true);
            } else {
                low = data.getUint32(idx + 4, false);
                high = data.getUint32(idx, false);
            }
            return formatInteger64bit(low, high, base, strWidth, signed);
        }
        assertExhausted(width);
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
        case RendererType.Ascii: {
            return byteAsAscii;
        }
        case RendererType.Integer: {
            const cc = config as IntegerRendererConfig;
            return createIntegerRenderer(cc.width, cc.signed, cc.littleEndian, cc.displayBase);
        }
        default:
            assertExhausted(config.rendererType);
    }
}

export function createStridedRenderer(config: RendererConfig, strideSize: number) {
    const renderer = createRenderer(config);
    return (data: DataView, idx: number) => renderer(data, idx * strideSize);
}
