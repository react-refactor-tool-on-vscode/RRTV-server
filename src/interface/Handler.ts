/**
 * Handler interface for all handlers.
 * 
 * @param T - Output type.
 * @param U - Request type.
 */
interface Handler<T, U> {
    /**
     * Set the next handler.
     * 
     * @param handler The handler to be chained after.
     * @returns The handler chained after, so that `setNext()` can be used like `a.setNext(b).setNext(c)`.
     */
    setNext(handler: Handler<T, U>): Handler<T, U>;

    handle(prevOutput: T, request: U): T;
}

/**
 * Base handler.
 * 
 * @description Have full control over handling, and will not continue handling by default.
 */
abstract class BaseHandler<T, U> implements Handler<T, U> {
    protected nextHandler: Handler<T, U>;

    setNext(handler: Handler<T, U>): Handler<T, U> {
        this.nextHandler = handler;

        return handler;
    }

    abstract handle(prevOutput: T, request: U): T;
}

/**
 * Handler with output that continues until no successor.
 */
abstract class ContinuousOutputHandler<T, U> extends BaseHandler<T, U> {
    handle(prevOutput: T, request: U): T {
        if (this.nextHandler) {
            return this.nextHandler.handle(this.concreteHandle(prevOutput, request), request);
        }
        else return this.concreteHandle(prevOutput, request);
    }

    protected abstract concreteHandle(prevOutput: T, request: U): T;
}

/**
 * Handler without output that continues until no successor.
 */
abstract class ContinuousVoidHandler<U> extends BaseHandler<void, U> {
    handle(prevOutput: void, request: U): void {
        if (this.nextHandler) {
            this.concreteHandle(request);
            this.nextHandler.handle(prevOutput, request);
        }
        else return;
    }

    handleRequest(request: U): void {
        this.handle(undefined, request);
    }

    protected abstract concreteHandle(request: U): void;
}

export { BaseHandler, ContinuousOutputHandler, ContinuousVoidHandler };