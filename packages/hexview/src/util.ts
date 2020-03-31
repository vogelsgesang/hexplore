export function assert(value: unknown): asserts value {
    if (!value) {
        throw new Error("Assertion violated");
    }
}

export function assertUnreachable(_: never): never {
    throw new Error("Didn't expect to get here");
}