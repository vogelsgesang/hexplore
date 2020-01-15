import ReactDOM from "react-dom";
import React from "react";
import { act } from 'react-dom/test-utils';
import { assert } from "./util";
import { AddressGutter } from "./AddressGutter";

let container : HTMLDivElement | null = null;
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  // cleanup on exiting
  assert(container !== null);
  ReactDOM.unmountComponentAtNode(container);
  container.remove();
  container = null;
});

describe("displays the right addresses", ()=> {
    it("for 1-byte lines", () => {
        assert(container);
        act(() => {
          ReactDOM.render(<AddressGutter startOffset={0} endOffset={8} lineWidth={1} />, container);
        });
        const addresses = container.querySelectorAll('.address');
        expect(addresses.length).toBe(8);
        expect(addresses[0].innerHTML).toBe("0x0");
        expect(addresses[addresses.length-1].innerHTML).toBe("0x7");
    });
    it("for 8-byte lines", () => {
        assert(container);
        act(() => {
          ReactDOM.render(<AddressGutter startOffset={0} endOffset={128} lineWidth={8} />, container);
        });
        const addresses = container.querySelectorAll('.address');
        expect(addresses.length).toBe(16);
        expect(addresses[0].innerHTML).toBe("0x0");
        expect(addresses[addresses.length-1].innerHTML).toBe("0x78");
    });
    it("with a start offset", () => {
        assert(container);
        act(() => {
          ReactDOM.render(<AddressGutter startOffset={32} endOffset={64} lineWidth={8} />, container);
        });
        const addresses = container.querySelectorAll('.address');
        expect(addresses.length).toBe(4 );
        expect(addresses[0].innerHTML).toBe("0x20");
        expect(addresses[addresses.length-1].innerHTML).toBe("0x38");
    });
});