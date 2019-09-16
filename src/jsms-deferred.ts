type ThenCallback<D> = (value: D) => any;
type CatchCallback<D> = (reason: Error) => any;

// --------------------------------------------------------------------------------------------------------------------

/**
 *  Utility class for handling ECMAScript promises.
 */
export class JsmsDeferred<D> {
    // private static debugIdCounter = 0;
    // public debugId = 0;

    public _promise: Promise<D>;
    private resolvePromise: any;
    private rejectPromise: any;
    private resolveDeferred!: JsmsDeferred<D>;
    private thenCallback!: ThenCallback<D>;
    private thenDeferred!: JsmsDeferred<any> | undefined;
    private catchCallback!: CatchCallback<D>;

    constructor() {
        // this.debugId = JsmsDeferred.debugIdCounter++;

        this._promise = new Promise<D>((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
        });

        this._promise.then((value: D) => {
            try {
                // console.log("Resolved: #" + this.debugId);
    
                const thenResult = this.thenCallback ? this.thenCallback(value) : undefined;

                if (this.resolveDeferred && this.resolveDeferred.thenCallback) {
                    this.resolveDeferred.resolve(thenResult);
                }
    
                if (this.thenDeferred) {
                    this.thenDeferred.resolve(thenResult);
                }
            }
            catch (e) {
                this.resolveDeferred.reject(e);
            }
        }, (reason: any) => {
            // console.error("Rejected: #" + this.debugId);
            if (this.catchCallback) {
                this.catchCallback(reason);
            }
            if (this.thenDeferred) {
                this.thenDeferred.reject(reason);
            }
        });
        // .catch((reason: any) => {
        //     console.error("Caught: #" + this.debugId);
        // })
        // .finally(() => {
        //     console.log("Finally: #" + this.debugId);
        // });
    }

    public get promise(): Promise<D> {
        return this._promise;
    }

    /**
     *  Resolves the promise with the given value.
     * 
     *  @param value Argument to be resolved by this deferred - Promise or 
     *               thenable not supported (yet).
     */
    public resolve(value: D): JsmsDeferred<D> {
        // console.log("Resolving: #" + this.debugId);
        this.resolvePromise(value);
        this.resolveDeferred = new JsmsDeferred<D>();
        return this.resolveDeferred;
    }

    /**
     *  Rejects the promise with the given reason.
     *  
     *  @param reason Reason why the promise is rejected.
     */
    public reject(reason: any): void {
        this.rejectPromise(reason);
    }

    /**
     *  Chains this deferred to the given then callback.
     * 
     *  @param callback the function to call when the promise is fullfilled
     */
    public then(callback: ThenCallback<D>): JsmsDeferred<D> {
        // console.log("Chaining: #" + this.debugId);
        this.thenCallback = callback;
        this.thenDeferred = new JsmsDeferred<D>();
        return this.thenDeferred;
    }

    /**
     *  Chains this deferred to the given catch handler. In sake of simplicity,
     *  it doesn't return anything - therefore it can't be chained.
     * 
     *  @param callback a function called when the promise is rejected
     */
    public catch(callback: CatchCallback<D>): void {
        this.catchCallback = callback;
    }

    public intercept(): JsmsDeferred<D> | undefined {
        const thenDeferred = this.thenDeferred;
        this.thenDeferred = undefined;
        return thenDeferred;
    }
}
