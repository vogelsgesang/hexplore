import React, {useState, useRef, forwardRef, useImperativeHandle, useCallback} from "react";

import "./AddressEditor.css";

interface AdressEditorProperties {
    address: number;
    setAddress: (a: number) => void;
}

function parseAddress(str: string) {
    str = str.trim();
    if (/^0x[0-9a-fA-F]+$/.test(str)) {
        return Number.parseInt(str.substr(2), 16);
    } else if (/^[0-9]+$/.test(str)) {
        return Number.parseInt(str, 10);
    }
    return undefined;
}

export const AddressEditor = forwardRef(function AddressEditor({address, setAddress}: AdressEditorProperties, ref) {
    const [draft, setDraft] = useState<string | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);

    const addressValue = "0x" + address.toString(16);
    const displayedValue = draft ?? addressValue;

    function onKeyDown(e: React.KeyboardEvent) {
        if (!inputRef.current) return;
        if (e.key == "Enter") {
            let parsed: number | undefined = address;
            if (draft !== undefined) {
                parsed = parseAddress(draft);
            }
            if (parsed !== undefined) {
                setAddress(parsed);
                inputRef.current?.blur();
            }
            e.preventDefault();
        } else if (e.key == "Escape") {
            setDraft(addressValue);
            // Must set the "value" synchronously, such that the "setSelectionRange" works properly
            inputRef.current.value = addressValue;
            inputRef.current.setSelectionRange(0, inputRef.current.value.length);
            e.preventDefault();
        }
    }

    const onFocus = useCallback(() => {
        inputRef.current?.setSelectionRange(0, inputRef.current?.value.length);
    }, [inputRef]);

    useImperativeHandle(
        ref,
        () => ({
            focus: () => inputRef.current?.focus(),
        }),
        [inputRef],
    );

    return (
        <input
            className="hv-address-editor"
            type="text"
            ref={inputRef}
            value={displayedValue}
            onFocus={onFocus}
            onChange={e => setDraft(e.currentTarget.value)}
            onKeyDown={onKeyDown}
            onBlur={() => setDraft(undefined)}
            width={16}
        />
    );
});
