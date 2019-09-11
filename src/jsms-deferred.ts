export type ResolveFunction<R> = (value: R) => void;
export type RejectFunction<E> = (reason: E) => void;
type ThenCallback<D, R, E> = (value: D, resolve: ResolveFunction<R>, reject: RejectFunction<E>) => void;
type ChainedCallback = () => void;

/**
 * Utility class for handling ECMAScript 2015 promises.
 */
export class JsmsDeferred<D, R, E> {
    private thenCallback!: ThenCallback<D, R, E>;
    private _promise!: Promise<D>;
    private resolveFunction!: any;
    private rejectFunction!: any;
    private chained = false;
    private onChained: ChainedCallback;

    // tslint:disable-next-line: no-empty
    constructor(onChained: ChainedCallback = () => {}) {
        this.onChained = onChained;

        this._promise = new Promise<D>((resolve, reject) => {
            this.resolveFunction = resolve;
            this.rejectFunction = reject;
        });
    }

    get promise(): Promise<D> {
        this.notifyChained();
        return this._promise;
    }

    private notifyChained(): void {
        if (!this.chained) {
            this.chained = true;
            this.onChained();
        }
    }

    public then(callback: ThenCallback<D, R, E>): Promise<D> {
        this.thenCallback = callback;
        this.notifyChained();
        return this._promise;
    }

    public resolve(value: D): void {
        if (this.thenCallback) {
            this.thenCallback(value, this.resolveFunction, this.rejectFunction);
        } else {
            this.resolveFunction(value);
        }
    }

    public reject(reason: E): void {
        this.rejectFunction(reason);
    }
}
