import {Bookmark} from "../BookmarksPanel";
import {FileFormatSpecification} from "./formats";
//@ts-ignore
import WindowsMinidump from "./katai/WindowsMiniDump";
//@ts-ignore
import KaitaiStream from "./katai/KaitaiStream";

function getBookmarks(data: ArrayBuffer) {
    try {
        const parsedMinidump = new WindowsMinidump(new KaitaiStream(data));
        const bookmarks: Bookmark[] = [];
        console.log(parsedMinidump.streams);
        bookmarks.push({
            from: parsedMinidump.ofsStreams as number,
            to: (parsedMinidump.ofsStreams + parsedMinidump.numStreams * 12) as number,
            key: "mdmp_dir",
            className: "hv-highlight-blue",
            name: "Directory",
        });
        for (const stream of parsedMinidump.streams) {
            let name = "";
            if (WindowsMinidump.StreamTypes.hasOwnProperty(stream.streamType)) {
                name = WindowsMinidump.StreamTypes[stream.streamType];
            } else {
                name = "stream " + stream.streamType;
            }
            bookmarks.push({
                from: stream.ofsData as number,
                to: (stream.ofsData + stream.lenData) as number,
                key: "mdmp_stream_" + stream.streamType,
                className: "hv-highlight-red",
                name: name,
            });
        }
        return bookmarks;
    } catch (e) {
        console.log(e);
        return [];
    }
}

export const MinidumpFormat: FileFormatSpecification = {
    header: [77, 68, 77, 80, 147, 167],
    getBookmarks: getBookmarks,
};
