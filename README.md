# RRTV-server

## Development

`server.ts` is the direct listener on lsp-client and the dispatcher of events and callbacks.

New features can be added by creating handler class and implement corresponding methods.
Handlers need to be manuallly added to `server.ts`.

Please pay attention to the usage of `Handler`: `new Handler().setNext(new Handler())` returns the **last** handler, not the first one.