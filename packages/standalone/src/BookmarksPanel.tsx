import React from "react";
import {HighlightRange} from "hexplore-hexview";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import produce from "immer";

import "./BookmarksPanel.css";

export interface Bookmark extends HighlightRange {
    name: string;
}

interface BookmarksPanelProps {
    bookmarks: Bookmark[];
    setBookmarks: (h: Bookmark[]) => void;
    goto: (b: Bookmark) => void;
}

export function BookmarksPanel({bookmarks, setBookmarks, goto}: BookmarksPanelProps) {
    function removeBookmark(pos: number) {
        setBookmarks(
            produce(bookmarks, draft => {
                draft.splice(pos, 1);
            }),
        );
    }
    function renameBookmark(pos: number, newName: string) {
        setBookmarks(
            produce(bookmarks, draft => {
                draft[pos].name = newName;
            }),
        );
    }

    const renderedBookmarks = [];
    for (let i = 0; i < bookmarks.length; ++i) {
        const bookmark = bookmarks[i];
        renderedBookmarks.push(
            <div key={bookmark.key} role="group" aria-label={bookmark.name} className="hv-bookmarks-list-entry">
                <input
                    aria-label="Bookmark name"
                    type="text"
                    className="hv-stealth-input hv-bookmarks-list-name"
                    value={bookmark.name}
                    onChange={e => renameBookmark(i, e.target.value)}
                />
                <ButtonGroup>
                    <Button onClick={() => goto(bookmark)} size="sm" variant="outline-primary">
                        Go to
                    </Button>
                    <Button
                        title="Remove"
                        onClick={removeBookmark.bind(undefined, i)}
                        size="sm"
                        variant="outline-danger"
                    >
                        X
                    </Button>
                </ButtonGroup>
            </div>,
        );
    }
    let bookmarksContent;
    if (renderedBookmarks.length > 0) {
        bookmarksContent = <div className="hv-bookmarks-list">{renderedBookmarks}</div>;
    } else {
        bookmarksContent = <div className="hv-bookmarks-empty-placeholder">No bookmarks, yet.</div>;
    }

    return (
        <div className="hv-bookmarks-panel">
            {bookmarksContent}
            <div className="hv-bookmarks-hint">
                Press <kbd>m</kbd> to create a bookmark for the currently selected range
            </div>
        </div>
    );
}
