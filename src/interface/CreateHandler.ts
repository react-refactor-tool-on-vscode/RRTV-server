import {
    BaseHandler,
    ContinuousOutputHandler,
    ContinuousVoidHandler,
    Handler,
} from "./Handler";

/**
 * Create callback handler using handlers.
 *
 * @param T - Output type.
 * @param U - Request type.
 */
function createHandler<T, U>(handlers: Handler<T, U>[], defaultOutput: T): (params: U) => T {
    let handler = handlers[0];
    handlers.slice(1).forEach((next) => {
        handler = handler.setNext(next);
    })

    return function (params: U): T {
        return handlers[0].handle(defaultOutput, params);
    }
}

export default createHandler;
