import {
    CodeAction,
    CodeActionParams,
    Command,
    createConnection,
    Diagnostic,
    ExecuteCommandParams,
    InitializeParams,
    InitializeResult,
    ProposedFeatures,
    TextDocumentChangeEvent,
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

import {ExtractAttrHandler, ExtractExprHandler} from './handler/ExtractAttrHandler'
import { StateLiftingCodeActionHandler, StateLiftingExecuteCommandHandler } from "./handler/stateLifting";
import { HookParamDiagHandler, HookParamFixHandler} from "./handler/HookParamDiagHandler";
import { SimilarComponentDiagHandler,  SimilarComponentCAHandler} from './handler/SimilarCompDiagHandler'
import { SendDiagnosticsHandler } from "./handler/SendDiagnostic";

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
                    "extract-attribute.0",
                    "rrtv.stateLifting.0",
                    "rrtv.stateLifting.1"
                ],
            },
        },
    };

    return result;
});

documents.onDidChangeContent(
    createHandler<Diagnostic[], TextDocumentChangeEvent<TextDocument>>(
        [
            new HookParamDiagHandler(),
            new SimilarComponentDiagHandler(),
            new SendDiagnosticsHandler(),
        ],
        []
    )
)

connection.onCodeAction(
    createHandler<(Command | CodeAction)[], CodeActionParams>(
        [
            new PropFlattenCodeActionHandler(),
            new AttrEditHandler(),
            new ExtractAttrHandler(),
            new ExtractExprHandler(),
            new StateLiftingCodeActionHandler(),
            new HookParamFixHandler(),
            new SimilarComponentCAHandler(),
        ],
        []
    )
);

connection.onExecuteCommand(
    createHandler<void, ExecuteCommandParams>(
        [
            new PropFlattenExecuteCommandHandler(),
            new AttrEditExecuteCommandHandler(),
            new StateLiftingExecuteCommandHandler()
        ],
        null
    )
);


// Start listening.
documents.listen(connection);
connection.listen();
