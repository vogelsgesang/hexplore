import {Bookmark} from "../BookmarksPanel";
import {MinidumpFormat} from "./WindowsMiniDump";

export interface FileFormatSpecification {
    header: Array<number>;
    getBookmarks: (d: ArrayBuffer) => Bookmark[];
}

export const allFormats = [MinidumpFormat];

function headerMatches(array: Uint8Array, header: Array<number>) {
    for (let i = 0; i < header.length; ++i) {
        if (header[i] != array[i]) {
            return false;
        }
    }
    return true;
}

export function findFormat(data: ArrayBuffer) {
    const array = new Uint8Array(data);
    for (const f of allFormats) {
        if (headerMatches(array, f.header)) return f;
    }
    return undefined;
}
