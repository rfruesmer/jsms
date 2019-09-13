export type ResolveFunction<R> = (value: R) => void;
export type RejectFunction<E> = (reason: E) => void;
type ThenCallback<D> = (value: D, resolve: ResolveFunction<D>) => any;
type ChainedCallback<D> = (next: JsmsDeferred<D> | undefined) => void;

/**
 *  Utility class for handling ECMAScript promises.
 * 
 *  NOTE: Chaining of JsmsDeferred is working different than with ECMAScript 
 *        promises in favor of allowing a request/reply-style pattern.
 */
export class JsmsDeferred<D> {
    public debugId = "";
    private thenCallback!: ThenCallback<D>;
    private _promise!: Promise<D>;
    private resolveFunction!: any;
    private rejectFunction!: any;
    private onChained: ChainedCallback<D>;
    private next?: JsmsDeferred<D>;
    private _thenResult?: D;

    /**
     * 
     * @param onChained Callback function that is called when either a then 
     *                  function is chained to this deferred or when the 
     *                  promise is requested.
     */
    constructor(onChained: ChainedCallback<D> = () => { /** do nothing */}) {
        this.onChained = onChained;
        this._promise = new Promise<D>((resolve, reject) => {
            this.resolveFunction = resolve;
            this.rejectFunction = reject;
        });
    }

    /**
     *  Requesting the promise sets this deferred into an active state by 
     *  calling the onChained handler.
     * 
     *  @returns the internal promise object
     */
    get promise(): Promise<D> {
        this.onChained(this.next);
        return this._promise;
    }

    /**
     *  @returns the result of the then function (if any)
     */
    public get thenResult(): D | undefined {
        return this._thenResult;
    }

    /**
     *  Chains this deferred to the given then callback and sets it into an 
     *  active state by calling the onChained handler.
     * 
     *  @param callback the function to call when the promise is fullfilled
     */
    public then(callback: ThenCallback<D>): JsmsDeferred<D> {
        this.thenCallback = callback;
        this.next = new JsmsDeferred<D>();
        this.next.debugId = this.debugId + " next";
        this.onChained(this.next);
        return this.next;
    }

    /**
     *  Resolves the promise with the given value.
     * 
     *  @param value Argument to be resolved by this deferred - Promise or 
     *               thenable not supported (yet).
     */
    public resolve(value: D): void {
        if (this.thenCallback) {
            this._thenResult = this.thenCallback(value, this.resolveFunction);
            if (this._thenResult) {
                this.resolveFunction(this._thenResult);
            }
        } 
        else {
            this.resolveFunction(value);
        }
    }

    /**
     *  Resolves the promise with the given reason.
     *  
     *  @param reason Reason why the promise is rejected.
     */
    public reject(reason: any): void {
        this.rejectFunction(reason);
    }
}
