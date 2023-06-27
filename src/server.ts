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

import { AttrEditHandler, addTabStop, generateSnippet } from "./handler/attributeEdit";

export let connection = createConnection(ProposedFeatures.all);

export let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            hoverProvider: false,
            codeActionProvider: true,
            executeCommandProvider: {
                // TODO: commands be clarified and filled.
                commands: [
                    "provide attribute", 
                    "provide attribute exec",
                    "run snippet"
                ],
            },
        },
    };

    return result;
});

// Usage: connection.onCodeAction(createHandler<(CodeAction | Command)[], CodeActionParams>([], []));

connection.onCodeAction(createHandler<(CodeAction | Command)[], CodeActionParams> (
    [
        new AttrEditHandler()
    ], 
    []
    )
);

connection.onExecuteCommand((params) => {
    const command = params.command;
    if(command === 'provide attribute exec') {
        generateSnippet(params);
    }
})
// Start listening.
documents.listen(connection);
connection.listen();