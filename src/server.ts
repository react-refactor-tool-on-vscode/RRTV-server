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

import {ExtractAttrHandler} from './handler/ExtractAttrHandler'

export const connection = createConnection(ProposedFeatures.all);

export const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            codeActionProvider: true,
            executeCommandProvider: {
                // TODO: commands be clarified and filled.
                commands: [
                    "extract-attribute.0"
                ],
            },
        },
    };

    return result;
});

// Usage: connection.onCodeAction(createHandler<(CodeAction | Command)[], CodeActionParams>([], []));

connection.onCodeAction(
    createHandler<(CodeAction | Command)[], CodeActionParams>([
        new ExtractAttrHandler()
    ], [])
);

// Start listening.
documents.listen(connection);
connection.listen();