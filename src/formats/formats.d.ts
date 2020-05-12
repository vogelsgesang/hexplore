import { Bookmark } from "../BookmarksPanel";
export interface FileFormatSpecification {
    header: Array<number>;
    getBookmarks: (d: ArrayBuffer) => Bookmark[];
}
export declare const allFormats: FileFormatSpecification[];
export declare function findFormat(data: ArrayBuffer): FileFormatSpecification | undefined;
//# sourceMappingURL=formats.d.ts.map