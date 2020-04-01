import React, {useMemo} from "react";
import {ColumnConfig} from "hexplore-hexview";
import {createRenderer, humanReadableColumnName} from "hexplore-hexview/dist/ByteRenderer";

import "./DataInspector.css";

interface DataInspectorProps {
    data: ArrayBuffer;
    position: number;
    representations: ColumnConfig[];
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
    representation: ColumnConfig;
}

function DataInspectorCell({data, position, representation}: DataInspectorCellProps) {
    const renderer = useMemo(() => createRenderer(representation), [representation]);
    return (
        <React.Fragment>
            <div className="hv-data-inspector-caption">{humanReadableColumnName(representation)}</div>
            <div className="hv-data-inspector-value">{renderer(data, position)}</div>
        </React.Fragment>
    );
}
