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

import { PropFlattenCodeActionHandler } from "./handler/PropFlatten";

export const connection = createConnection(ProposedFeatures.all);

export const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
            },
            hoverProvider: true,
            codeActionProvider: true,
            executeCommandProvider: {
                // TODO: commands be clarified and filled.
                commands: ["rrtv.propFlatten"],
            },
        },
    };

    return result;
});

connection.onCodeAction(
    createHandler<(Command | CodeAction)[], CodeActionParams>(
        [new PropFlattenCodeActionHandler()],
        []
    )
);

// Start listening.
documents.listen(connection);
connection.listen();
