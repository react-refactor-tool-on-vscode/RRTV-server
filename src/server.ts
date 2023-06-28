import {
    CodeAction,
    CodeActionParams,
    Command,
    createConnection,
    ExecuteCommandParams,
    InitializeParams,
    InitializeResult,
    ProposedFeatures,
    TextDocuments,
    TextDocumentSyncKind,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import createHandler from "./interface/CreateHandler";

import {
    PropFlattenCodeActionHandler,
    PropFlattenExecuteCommandHandler,
} from "./handler/PropFlatten";

import { AttrEditHandler, AttrEditExecuteCommandHandler} from "./handler/attributeEdit";

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
                    "rrtv.propFlatten",
                    "provide-attribute.0",
                    "provide-attribute.1",
                    "provide-attribute.2",
                    "extract-attribute.0"
                ],
            },
        },
    };

    return result;
});

connection.onCodeAction(
    createHandler<(Command | CodeAction)[], CodeActionParams>(
        [
            new PropFlattenCodeActionHandler(),
            new AttrEditHandler(),
            new ExtractAttrHandler()
        ],
        []
    )
);

connection.onExecuteCommand(
    createHandler<void, ExecuteCommandParams>(
        [
            new PropFlattenExecuteCommandHandler(),
            new AttrEditExecuteCommandHandler()
        ],
        null
    )
);


// Start listening.
documents.listen(connection);
connection.listen();
