import React from "react";
import snapshotRenderer from "react-test-renderer";
import {render, fireEvent, screen, act} from "@testing-library/react";
import {AddressEditor} from "./AddressEditor";

describe("displays the address correctly", () => {
    function testRendering(pos: number) {
        const component = snapshotRenderer.create(<AddressEditor address={pos} setAddress={() => {}} />);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    }

    test("for address 0", () => {
        testRendering(0);
    });
    test("for address 33", () => {
        testRendering(33);
    });
});

describe("can be edited", () => {
    test("selects whole text on focus", () => {
        const handleChange = jest.fn();
        render(<AddressEditor address={0x7b} setAddress={handleChange} />);
        const inputField = screen.getByDisplayValue("0x7b") as HTMLInputElement;
        act(() => {
            inputField.focus();
        });
        expect(inputField.selectionStart).toBe(0);
        expect(inputField.selectionEnd).toBe(inputField.value.length);
    });
    test("sets address on enter", () => {
        const handleChange = jest.fn();
        render(<AddressEditor address={0x7b} setAddress={handleChange} />);
        fireEvent.change(screen.getByDisplayValue("0x7b"), {target: {value: "180"}});
        fireEvent.keyDown(screen.getByDisplayValue("180"), {key: "Enter"});
        expect(handleChange).toHaveBeenCalledWith(180);
    });
    test("does not set address during editing", () => {
        const handleChange = jest.fn();
        render(<AddressEditor address={0x7b} setAddress={handleChange} />);
        fireEvent.change(screen.getByDisplayValue("0x7b"), {target: {value: "180"}});
        // No "Enter" key has been hit -> no callback was called
        expect(handleChange).not.toHaveBeenCalled();
    });
    test("does not accept invalid strings", () => {
        const handleChange = jest.fn();
        render(<AddressEditor address={0x7b} setAddress={handleChange} />);
        fireEvent.change(screen.getByDisplayValue("0x7b"), {target: {value: "not an address"}});
        fireEvent.keyDown(screen.getByDisplayValue("not an address"), {key: "Enter"});
        expect(handleChange).not.toHaveBeenCalled();
    });
    test("resets address on escape and selects whole text", () => {
        const handleChange = jest.fn();
        render(<AddressEditor address={0x7b} setAddress={handleChange} />);
        const inputField = screen.getByDisplayValue("0x7b") as HTMLInputElement;
        inputField.value = "180";
        fireEvent.change(inputField, {target: {value: "180"}});
        fireEvent.keyDown(inputField, {key: "Escape"});
        expect(inputField.value).toBe("0x7b");
        expect(inputField.selectionStart).toBe(0);
        expect(inputField.selectionEnd).toBe(inputField.value.length);
        expect(handleChange).not.toHaveBeenCalled();
    });
});
