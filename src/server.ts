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

export const connection = createConnection(ProposedFeatures.all);

export const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
import { AttrEditHandler, AttrEditExecuteCommandHandler} from "./handler/attributeEdit";
import { addTabStop } from "./helper/attrInsertor";



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
                    "provide-attribute.2"
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
            new AttrEditHandler()
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
