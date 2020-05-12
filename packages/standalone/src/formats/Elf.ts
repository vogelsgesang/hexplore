import {Bookmark} from "../BookmarksPanel";
import {FileFormatSpecification} from "./formats";
//@ts-ignore
import Elf from "./katai/Elf";
//@ts-ignore
import KaitaiStream from "./katai/KaitaiStream";

function getBookmarks(data: ArrayBuffer) {
    try {
        const elf = new Elf(new KaitaiStream(data));
        const bookmarks: Bookmark[] = [];
        // section headers, program headers, strings
        let sectionId = 0;
        for (const section of elf.header.sectionHeaders) {
            if (section.type == Elf.ShType.NULL_TYPE) continue;
            let name = section.name;
            bookmarks.push({
                from: section.ofsBody as number,
                to: (section.ofsBody + section.lenBody) as number,
                key: "elf_section_" + sectionId,
                className: ["hv-highlight-red", "hv-highlight-blue"][sectionId % 2],
                name: name,
            });
            ++sectionId;
        }
        return bookmarks;
    } catch (e) {
        console.log(e);
        return [];
    }
}

export const ElfFormat: FileFormatSpecification = {
    header: [127, 69, 76, 70],
    getBookmarks: getBookmarks,
};
