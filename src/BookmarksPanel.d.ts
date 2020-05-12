/// <reference types="react" />
import { HighlightRange } from "hexplore-hexview";
import "./BookmarksPanel.css";
export interface Bookmark extends HighlightRange {
    name: string;
}
interface BookmarksPanelProps {
    bookmarks: Bookmark[];
    setBookmarks: (h: Bookmark[]) => void;
    goto: (b: Bookmark) => void;
    exportRange: (b: Bookmark) => void;
}
export declare function BookmarksPanel({ bookmarks, setBookmarks, goto, exportRange }: BookmarksPanelProps): JSX.Element;
export {};
//# sourceMappingURL=BookmarksPanel.d.ts.map