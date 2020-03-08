import ReactDOM from "react-dom";
import React from "react";
import { act } from 'react-dom/test-utils';
import { assert } from "./util";
import { DataGrid } from "./DataGrid";

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

/*
* can be focused
* cursor movement with keyboard
* selection with keyboard
    * forwards selection + backwards selection
* selection with mouse
    * forwards selection + backwards selection
* cursor movement resets selection
*/

describe("renders elements", () => {
  test("as hexadecimal bytes", () => {
      assert(container);
      act(() => {
        //ReactDOM.render(<AddressGutter startOffset={0} endOffset={8} lineWidth={1} />, container);
      });
      const addresses = container.querySelectorAll('.address');
      expect(addresses.length).toBe(8);
      expect(addresses[0].innerHTML).toBe("0x0");
      expect(addresses[addresses.length-1].innerHTML).toBe("0x7");
  });
  test("as ASCII characters", () => {
  });
});

describe("the cursor", ()=> {
    
});

describe("selections", ()=> {
    
});