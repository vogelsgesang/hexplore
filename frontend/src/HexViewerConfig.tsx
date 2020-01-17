export enum ColumnType {
    AddressGutter,
    AsciiColumn,
    IntegerColumn,
}

export enum AddressDisplayMode {
    Decimal,
    Hexadecimal
}

export enum IntegerDisplayMode {
    Binary,
    Octal,
    Decimal,
    Hexadecimal
}

export interface ColumnConfig {
    columnType: ColumnType;
}

export class AddressGutterConfig implements ColumnConfig {
    columnType = ColumnType.AddressGutter;
    constructor(public offset: number, public displayMode: AddressDisplayMode, public paddingWidth: number) { }
}

export class AsciiColumnConfig implements ColumnConfig {
    columnType = ColumnType.AsciiColumn;
}

export class IntegerColumnConfig implements ColumnConfig {
    columnType = ColumnType.IntegerColumn;
    constructor(public signed : boolean, public width: 1 | 2 | 4, public littleEndian: boolean, public displayMode: IntegerDisplayMode) { }
}

export interface HexViewerConfig {
    lineWidth: number;
    columns: ColumnConfig[];
}

export const defaultConfig : HexViewerConfig = {
    lineWidth: 16,
    columns: [
        new AddressGutterConfig(0, AddressDisplayMode.Hexadecimal, 0),
        new IntegerColumnConfig(false, 1, true, IntegerDisplayMode.Hexadecimal),
        new AsciiColumnConfig()
    ]
}