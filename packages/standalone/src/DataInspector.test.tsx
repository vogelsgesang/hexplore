import React from "react";
import snapshotRenderer from "react-test-renderer";
import {DataInspector, defaultInspectorRepresentations} from "./DataInspector";

function constData(bytes: number[]) {
    const buf = new ArrayBuffer(bytes.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, len = bytes.length; i < len; i++) {
        bufView[i] = bytes[i];
    }
    return buf;
}

describe("displays the data correctly", () => {
    const testData = constData([1, 2, 3, 4, 5, 6, 7, 8]);
    function testRendering(pos: number) {
        const component = snapshotRenderer.create(
            <DataInspector data={testData} position={pos} representations={defaultInspectorRepresentations} />,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    }

    test("for address 0", () => {
        testRendering(0);
    });
    test("for address 1", () => {
        testRendering(1);
    });
    test("for last address", () => {
        testRendering(testData.byteLength - 1);
    });
});
