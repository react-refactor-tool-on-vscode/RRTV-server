import {
    CodeAction,
    CodeActionParams,
    Command,
    createConnection,
    InitializeParams,
    InitializeResult,
    ProposedFeatures,
    TextDocuments,
    TextDocumentSyncKind,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import createHandler from "./interface/CreateHandler";

import {ExtractComponentHandler} from './handler/extract-component'

export let connection = createConnection(ProposedFeatures.all);

export let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
            },
            hoverProvider: false,
            codeActionProvider: true,
            executeCommandProvider: {
                // TODO: commands be clarified and filled.
                commands: [],
            },
        },
    };

    return result;
});

// Usage: connection.onCodeAction(createHandler<(CodeAction | Command)[], CodeActionParams>([], []));
connection.onCodeAction(createHandler<(CodeAction | Command)[], CodeActionParams>([
    new ExtractComponentHandler
], []))
// Start listening.
documents.listen(connection);
connection.listen();