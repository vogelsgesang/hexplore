import {immerable} from "immer";

export enum ColumnType {
    AddressGutter,
    AsciiColumn,
    IntegerColumn,
}

export type AddressDisplayBase = 10 | 16;

export type IntegerDisplayBase = 2 | 8 | 10 | 16;

export interface ColumnConfig {
    columnType: ColumnType;
}

export class AddressGutterConfig implements ColumnConfig {
    [immerable] = true;
    columnType = ColumnType.AddressGutter;
    constructor(public displayBase: AddressDisplayBase) {}
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
        public displayBase: IntegerDisplayBase,
    ) {}
}

export interface HexViewerConfig {
    lineWidth: number;
    columns: ColumnConfig[];
}

export const defaultConfig: HexViewerConfig = {
    lineWidth: 16,
    columns: [
        new AddressGutterConfig(16),
        new IntegerColumnConfig(false, 1, true, 16),
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
