export function checkState(condition: boolean, message: string = ""): void {
    if (!condition) {
        throw new Error("Illegal state: " + message);
    }
}
