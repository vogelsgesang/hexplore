/*import ReactDOM from "react-dom";
import {act} from "react-dom/test-utils";
import {assert} from "./util";

let container: HTMLDivElement | null = null;
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

describe("renders elements", () => {
    test("as hexadecimal bytes", () => {
        assert(container);
        act(() => {
            //ReactDOM.render(<AddressGutter startOffset={0} endOffset={8} lineWidth={1} />, container);
        });
        const addresses = container.querySelectorAll(".address");
        expect(addresses.length).toBe(8);
        expect(addresses[0].innerHTML).toBe("0x0");
        expect(addresses[addresses.length - 1].innerHTML).toBe("0x7");
    });
});
*/