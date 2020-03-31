import {assertUnreachable as assertExhausted} from "./util";

import {
    ColumnType,
    AddressGutterConfig,
    IntegerColumnConfig,
    IntegerDisplayBase,
    ColumnConfig,
    AddressDisplayBase,
} from "./HexViewerConfig";

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

export function createRenderer(columnConfig: ColumnConfig) {
    switch (columnConfig.columnType) {
        case ColumnType.AddressGutter: {
            const cc = columnConfig as AddressGutterConfig;
            return createAddressRenderer(cc.displayBase);
        }
        case ColumnType.AsciiColumn: {
            return byteAsAscii;
        }
        case ColumnType.IntegerColumn: {
            const cc = columnConfig as IntegerColumnConfig;
            return createIntegerRenderer(cc.width, cc.signed, cc.littleEndian, cc.displayBase);
        }
        default:
            assertExhausted(columnConfig.columnType);
    }
}

export function createStridedRenderer(columnConfig: ColumnConfig, strideSize: number) {
    const renderer = createRenderer(columnConfig);
    return (data: DataView, idx: number) => renderer(data, idx * strideSize);
}
