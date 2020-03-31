// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import expect = require("expect.js");

import // Add any needed widget imports here (or from controls)
"@jupyter-widgets/base";

import {createTestModel} from "./utils.spec";

import {ExampleModel, ExampleView} from "../../src/";

describe("Example", () => {
    describe("ExampleModel", () => {
        it("should be createable", () => {
            const model = createTestModel(ExampleModel);
            expect(model).to.be.an(ExampleModel);
            expect(model.get("value")).to.be("Hello World");
        });

        it("should be createable with a value", () => {
            const state = {value: "Foo Bar!"};
            const model = createTestModel(ExampleModel, state);
            expect(model).to.be.an(ExampleModel);
            expect(model.get("value")).to.be("Foo Bar!");
        });
    });
});
