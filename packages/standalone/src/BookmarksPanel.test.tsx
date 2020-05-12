import React from "react";
import snapshotRenderer from "react-test-renderer";
import {render, fireEvent, screen, getByTitle, getByText, getByLabelText} from "@testing-library/react";
import {BookmarksPanel, Bookmark} from "./BookmarksPanel";

const testBookmarkList: Bookmark[] = [
    {from: 0, to: 4, name: "Bookmark 1", key: "t1"},
    {from: 10, to: 20, name: "My 2nd bookmark", key: "t2"},
    {from: 30, to: 32, name: "Numero tres", key: "t3"},
];

const dummyProps = {
    setBookmarks: () => {},
    goto: () => {},
    exportRange: () => {},
};

test("displays an empty list correctly", () => {
    const component = snapshotRenderer.create(<BookmarksPanel {...dummyProps} bookmarks={[]} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("displays a bookmark list correctly", () => {
    const component = snapshotRenderer.create(<BookmarksPanel {...dummyProps} bookmarks={testBookmarkList} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("can remove a bookmark", () => {
    const cfgRef = {current: testBookmarkList};
    render(
        <BookmarksPanel
            {...dummyProps}
            bookmarks={testBookmarkList}
            setBookmarks={b => {
                cfgRef.current = b;
            }}
        />,
    );
    const group = screen.getByLabelText("My 2nd bookmark");
    fireEvent.click(getByTitle(group, /remove/i));
    expect(cfgRef.current.length).toBe(2);
    expect(cfgRef.current[0]).toBe(testBookmarkList[0]);
    expect(cfgRef.current[1]).toBe(testBookmarkList[2]);
});

test("can edit the name", () => {
    const cfgRef = {current: testBookmarkList};
    render(
        <BookmarksPanel
            {...dummyProps}
            bookmarks={testBookmarkList}
            setBookmarks={b => {
                cfgRef.current = b;
            }}
        />,
    );
    const group = screen.getByLabelText("My 2nd bookmark");
    fireEvent.change(getByLabelText(group, /bookmark name/i), {target: {value: "El segundo"}});
    expect(cfgRef.current.length).toBe(3);
    expect(cfgRef.current[0]).toBe(testBookmarkList[0]);
    expect(cfgRef.current[1].name).toBe("El segundo");
    expect(cfgRef.current[2]).toBe(testBookmarkList[2]);
});

test("can `go to` a bookmark", () => {
    const gotoFn = jest.fn();
    render(<BookmarksPanel {...dummyProps} bookmarks={testBookmarkList} goto={gotoFn} />);
    const group = screen.getByLabelText("My 2nd bookmark");
    fireEvent.click(getByText(group, /go to/i));
    expect(gotoFn).toHaveBeenCalledTimes(1);
    expect(gotoFn).toHaveBeenCalledWith(testBookmarkList[1]);
});

test("can `export` the range of a bookmark", () => {
    const gotoFn = jest.fn();
    render(<BookmarksPanel {...dummyProps} bookmarks={testBookmarkList} exportRange={gotoFn} />);
    const group = screen.getByLabelText("My 2nd bookmark");
    fireEvent.click(getByTitle(group, /Export/i));
    expect(gotoFn).toHaveBeenCalledTimes(1);
    expect(gotoFn).toHaveBeenCalledWith(testBookmarkList[1]);
});
