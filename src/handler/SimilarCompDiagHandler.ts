import {
    CodeAction,
    CodeActionParams,
    Command,
    Range,
    TextDocumentChangeEvent,
    TextDocumentItem,
    TextDocuments,
    TextEdit,
    CodeActionKind,
    ExecuteCommandParams,
    TextDocumentEdit,
    ExecuteCommandRequest,
    Diagnostic,
    DiagnosticSeverity,
    WorkspaceChange,
} from "vscode-languageserver/node";
import { BaseHandler, ContinuousOutputHandler } from '../interface/Handler'
import { connection, documents } from '../server'
import { TextDocument } from "vscode-languageserver-textdocument";
import { checkIfDiag } from "../helper/extractSmilarComponent";
import { locToRange } from "../helper/locToRange";

export class SimilarComponentDiagHandler extends BaseHandler<void, TextDocumentChangeEvent<TextDocument>> {
    handle(prevOutput: void, request: TextDocumentChangeEvent<TextDocument>): void {
        const document = request.document;
        const res = checkIfDiag(document.getText());
        if(!res.diag) {
            this.nextHandler.handle(null, request);
        }
        const diagnostics:Diagnostic[] = []
        for(const key in res.cache.range) {
            const range = res.cache.range[key];
            const diagnostic = Diagnostic.create(
                range, 
                "Similar component which can be extracted",
                DiagnosticSeverity.Warning
            );
            diagnostics.push(diagnostic);
        }
        connection.sendDiagnostics({uri:document.uri, diagnostics:diagnostics});
        this.nextHandler.handle(null, request);   
    }
}