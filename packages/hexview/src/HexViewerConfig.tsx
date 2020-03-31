export enum ColumnType {
    AddressGutter = "AddressGutter",
    AsciiColumn = "Ascii",
    IntegerColumn = "Integer",
}

export type AddressDisplayBase = 10 | 16;

export type IntegerDisplayBase = 2 | 8 | 10 | 16;

export interface ColumnConfig {
    columnType: ColumnType;
}

export interface AddressGutterConfig extends ColumnConfig {
    columnType: ColumnType.AddressGutter;
    displayBase: AddressDisplayBase;
}

export interface AsciiColumnConfig extends ColumnConfig {
    columnType: ColumnType.AsciiColumn;
}

export interface IntegerColumnConfig extends ColumnConfig {
    columnType: ColumnType.IntegerColumn;
    signed: boolean;
    width: 1 | 2 | 4 | 8;
    littleEndian: boolean;
    displayBase: IntegerDisplayBase;
}

export interface HexViewerConfig {
    lineWidth: number;
    columns: ColumnConfig[];
}

export const defaultConfig: HexViewerConfig = {
    lineWidth: 16,
    columns: [
        {columnType: ColumnType.AddressGutter, displayBase: 16} as AddressGutterConfig,
        {
            columnType: ColumnType.IntegerColumn,
            signed: false,
            width: 1,
            littleEndian: true,
            displayBase: 16,
        } as IntegerColumnConfig,
        {columnType: ColumnType.AsciiColumn} as AsciiColumnConfig,
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
