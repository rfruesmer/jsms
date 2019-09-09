
export type ResolveFunction<R> = (value: R) => void;
export type RejectFunction<E> = (reason: E) => void;
type ThenCallback<D, R, E> = (value: D, resolve: ResolveFunction<R>, reject: RejectFunction<E>) => void;
type ChainedCallback = () => void;

export class Deferred<D, R, E> {
    private thenCallback!: ThenCallback<D, R, E>;
    private _promise!: Promise<D>;
    private resolveFunction!: any;
    private rejectFunction!: any;
    private chainedCallback: ChainedCallback;

    // tslint:disable-next-line: no-empty
    constructor(chainedCallback: ChainedCallback = () => {}) {
        this.chainedCallback = chainedCallback;

        this._promise = new Promise<D>((resolve, reject) => {
            this.resolveFunction = resolve;
            this.rejectFunction = reject;
        });
    }
    
    get promise(): Promise<D> {
        this.chainedCallback();
        return this._promise;
    }

    public then(callback: ThenCallback<D, R, E>): Promise<D> {
        this.thenCallback = callback;
        this.chainedCallback();
        return this._promise;
    }

    public resolve(value: D): void {
        if (this.thenCallback) {
            this.thenCallback(value, this.resolveFunction, this.rejectFunction);
        }
        else {
            this.resolveFunction(value);
        }
    }

    public reject(reason: E): void {
        this.rejectFunction(reason);
    }
}
