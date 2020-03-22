import {immerable} from "immer";

export enum ColumnType {
    AddressGutter,
    AsciiColumn,
    IntegerColumn,
}

export enum AddressDisplayMode {
    Decimal,
    Hexadecimal,
}

export enum IntegerDisplayMode {
    Binary,
    Octal,
    Decimal,
    Hexadecimal,
}

export interface ColumnConfig {
    columnType: ColumnType;
}

export class AddressGutterConfig implements ColumnConfig {
    [immerable] = true;
    columnType = ColumnType.AddressGutter;
    constructor(public displayMode: AddressDisplayMode) {}
}

export class AsciiColumnConfig implements ColumnConfig {
    [immerable] = true;
    columnType = ColumnType.AsciiColumn;
}

export class IntegerColumnConfig implements ColumnConfig {
    [immerable] = true;
    columnType = ColumnType.IntegerColumn;
    constructor(
        public signed: boolean,
        public width: 1 | 2 | 4 | 8,
        public littleEndian: boolean,
        public displayMode: IntegerDisplayMode,
    ) {}
}

export interface HexViewerConfig {
    lineWidth: number;
    columns: ColumnConfig[];
}

export const defaultConfig: HexViewerConfig = {
    lineWidth: 16,
    columns: [
        new AddressGutterConfig(AddressDisplayMode.Hexadecimal),
        new IntegerColumnConfig(false, 1, true, IntegerDisplayMode.Hexadecimal),
        new AsciiColumnConfig(),
    ],
};

export function getAlignment(c: ColumnConfig) {
    switch (c.columnType) {
        case ColumnType.AddressGutter:
            return 1;
        case ColumnType.AsciiColumn:
            return 1;
        case ColumnType.IntegerColumn:
            return (c as IntegerColumnConfig).width;
    }
}
