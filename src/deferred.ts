import {checkState} from '@/preconditions';


export class Deferred<D, F> {
    private promise!: Promise<D>;
    private resolveCallback: any;
    private rejectCallback: any;
    private doneCallback!: (arg: D) => void;
    private failCallback!: (arg: F) => void;
    private catchCallback!: (arg: Error) => void;
    private finallyCallback!: () => void;

    constructor() {
        this.promise = new Promise<D>((resolve, reject) => {
            this.resolveCallback = resolve;
            this.rejectCallback = reject;
        });

        this.promise.then((arg: D) => {
            if (this.doneCallback) {
                this.doneCallback(arg);
            }
            if (this.finallyCallback) {
                this.finallyCallback();
            }
        }, (arg: F) => {
            if (this.failCallback) {
                this.failCallback(arg);
            }
            if (this.finallyCallback) {
                this.finallyCallback();
            }
        })
        .catch((reason) => {
            if (this.catchCallback) {
                try {
                    this.catchCallback(reason);
                }
                catch (error) {
                    console.error(error);
                }
            }
            if (this.finallyCallback) {
                this.finallyCallback();
            }
        });
    }

    public done(doneCallback: (arg: D) => void): Deferred<D, F> {
        checkState(!this.doneCallback, 'done already set');
        this.doneCallback = doneCallback;
        return this;
    }

    public fail(failCallback: (arg: F) => void): Deferred<D, F> {
        checkState(!this.failCallback, 'fail already set');
        this.failCallback = failCallback;
        return this;
    }

    public catch(catchCallback: (arg: Error) => void): Deferred<D, F> {
        checkState(!this.catchCallback, 'catch already set');
        this.catchCallback = catchCallback;
        return this;
    }

    public finally(finallyCallback: () => void): void {
        checkState(!this.finallyCallback, 'finally already set');
        this.finallyCallback = finallyCallback;
    }

    public resolve(arg: D): void {
        this.resolveCallback(arg);
    }

    public reject(arg: F): void {
        this.rejectCallback(arg);
    }
}
