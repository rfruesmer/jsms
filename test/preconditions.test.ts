import { checkState, checkArgument } from "@/preconditions";

// --------------------------------------------------------------------------------------------------------------------

test("checkState throws if condition is false", () => {
    expect(() => {
        checkState(false);
    }).toThrow(Error);
});

// --------------------------------------------------------------------------------------------------------------------

test("checkState doesn't throw if condition is true", () => {
    expect(() => {
        checkState(true);
    }).not.toThrow();
});

// --------------------------------------------------------------------------------------------------------------------

test("checkArgument throws if condition is false", () => {
    expect(() => {
        checkArgument(false);
    }).toThrow(Error);
});

// --------------------------------------------------------------------------------------------------------------------

test("checkArgument doesn't throw if condition is true", () => {
    expect(() => {
        checkArgument(true);
    }).not.toThrow();
});

// --------------------------------------------------------------------------------------------------------------------

