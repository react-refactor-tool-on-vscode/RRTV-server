# RRTV-server

## Development

`server.ts` is the direct listener on lsp-client and the dispatcher of events and callbacks.

New features can be added by creating handler class and implement corresponding methods.
Handlers need to be manuallly added to `server.ts`.

Please pay attention to the usage of `Handler`: `new Handler().setNext(new Handler())` returns the **last** handler, not the first one.

Normal back-end development follow the following order:

1. Write core algorithm functions.
2. Write handlers for handling lsp events.
3. Add them to corresponding event handler methods in `server.ts` using `createHandler()`.
4. Register the command names used to `server.ts`.
