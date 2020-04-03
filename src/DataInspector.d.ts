/// <reference types="react" />
import { ColumnConfig } from "hexplore-hexview";
import "./DataInspector.css";
interface DataInspectorProps {
    data: ArrayBuffer;
    position: number;
    representations: ColumnConfig[];
}
export declare function DataInspector({ data, position, representations }: DataInspectorProps): JSX.Element;
export {};
//# sourceMappingURL=DataInspector.d.ts.map