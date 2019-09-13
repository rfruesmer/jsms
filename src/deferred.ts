export type ResolveFunction<R> = (value: R) => void;
export type RejectFunction<E> = (reason: E) => void;
type ThenCallback<D> = (value: D, resolve: ResolveFunction<D>) => any;
type ChainedCallback<D> = (deferred?: Deferred<D>, next?: Deferred<D>) => void;

/**
 * Utility class for handling ECMAScript 2015 promises.
 */
export class Deferred<D> {
    public id = "";
    private thenCallback!: ThenCallback<D>;
    private _promise!: Promise<D>;
    private resolveFunction!: any;
    private rejectFunction!: any;
    private chained = false;
    public onChained: ChainedCallback<D>;
    public next?: Deferred<D>;
    public result?: D;

    // tslint:disable-next-line: no-empty
    constructor(onChained: ChainedCallback<D> = () => {}) {
        this.onChained = onChained;

        this._promise = new Promise<D>((resolve, reject) => {
            this.resolveFunction = resolve;
            this.rejectFunction = reject;
        });
    }

    get promise(): Promise<D> {
//        this.notifyChained();
        return this._promise;
    }

    private notifyChained(): void {
        if (!this.chained) {
            this.chained = true;
            this.onChained(this, this.next);
        }
    }

    public then(callback: ThenCallback<D>): Deferred<D> {
        this.thenCallback = callback;
        this.next = new Deferred<D>();
        this.next.id = this.id + " next";
        this.notifyChained();
        return this.next;
    }

    public resolve(value: D, resolve?: (response: D, resolve: ResolveFunction<D>) => void): void {
        if (this.thenCallback) {
            const thenCallbackPromise = new Promise<D>((thenCallbackResolve: any) => {
                this.promise.then(() => {
                    this.result = this.thenCallback(value, thenCallbackResolve);
                    console.log(this.result);
                });
            });

            this.resolveFunction(value);
        } 
        else {
            this.resolveFunction(value);
        }
    }
}
