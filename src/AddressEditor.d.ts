import React from "react";
interface AdressEditorProperties {
    address: number;
    setAddress: (a: number) => void;
}
export interface AddressEditorHandle {
    focus(): void;
}
export declare const AddressEditor: React.ForwardRefExoticComponent<AdressEditorProperties & React.RefAttributes<AddressEditorHandle>>;
export {};
//# sourceMappingURL=AddressEditor.d.ts.map