export function assert(value: unknown): asserts value {
    if (!value) {
        debugger;
        throw new Error("Assertion violated");
    }
}

export function assertUnreachable(_: never): never {
    debugger;
    throw new Error("Didn't expect to get here");
}
