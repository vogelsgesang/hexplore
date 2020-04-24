/// <reference types="react" />
import { RendererConfig } from "hexplore-hexview/dist/ByteRenderer";
import "./DataInspector.css";
interface DataInspectorProps {
    data: ArrayBuffer;
    position: number;
    representations: RendererConfig[];
}
export declare function DataInspector({ data, position, representations }: DataInspectorProps): JSX.Element;
export {};
//# sourceMappingURL=DataInspector.d.ts.map