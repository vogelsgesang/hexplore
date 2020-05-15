import React, {useMemo} from "react";
import {createRenderer, humanReadableRendererName, RendererConfig} from "hexplore-hexview/dist/ByteRenderer";
import {createAddressRendererConfig, createIntegerRendererConfig} from "hexplore-hexview/dist/ByteRenderer";

import "./DataInspector.css";

export const defaultInspectorRepresentations: RendererConfig[] = [
    createAddressRendererConfig(),
    createIntegerRendererConfig({displayBase: 10, width: 1, signed: true, fixedWidth: false}),
    createIntegerRendererConfig({displayBase: 10, width: 2, signed: true, fixedWidth: false}),
    createIntegerRendererConfig({displayBase: 10, width: 4, signed: true, fixedWidth: false}),
    createIntegerRendererConfig({displayBase: 10, width: 8, signed: true, fixedWidth: false}),
];

interface DataInspectorProps {
    data: ArrayBuffer;
    position: number;
    representations: RendererConfig[];
}

export function DataInspector({data, position, representations}: DataInspectorProps) {
    const view = useMemo(() => new DataView(data), [data]);
    return (
        <div className="hv-data-inspector">
            {representations.map((r, i) => (
                <DataInspectorCell key={i} data={view} position={position} representation={r} />
            ))}
        </div>
    );
}

interface DataInspectorCellProps {
    data: DataView;
    position: number;
    representation: RendererConfig;
}

function DataInspectorCell({data, position, representation}: DataInspectorCellProps) {
    const renderer = useMemo(() => createRenderer(representation), [representation]);
    return (
        <React.Fragment>
            <div className="hv-data-inspector-caption">{humanReadableRendererName(representation)}</div>
            <div className="hv-data-inspector-value">{renderer(data, position)}</div>
        </React.Fragment>
    );
}
