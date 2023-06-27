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

import { AttrEditHandler, generateSnippet } from "./handler/attributeEdit";
import { addTabStop } from "./helper/attrInsertor";

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
                    "provide-attribute.0", 
                    "provide-attribute.1",
                    "run snippet"
                ],
            },
        },
    };

    return result;
});

// Usage: connection.onCodeAction(createHandler<(CodeAction | Command)[], CodeActionParams>([], []));

connection.onCodeAction(
    createHandler<(CodeAction | Command)[], CodeActionParams> (
    [
        new AttrEditHandler()
    ], 
    []
    )
);

connection.onExecuteCommand((params) => {
    const command = params.command;
    if(command === 'provide-attribute.1') {
        generateSnippet(params);
    }
})
// Start listening.
documents.listen(connection);
connection.listen();