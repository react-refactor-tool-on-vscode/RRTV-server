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
    Position,
    CodeActionResolveRequest,
} from "vscode-languageserver/node";
import { BaseHandler, ContinuousOutputHandler } from '../interface/Handler'
import { connection, documents } from '../server'
import { TextDocument } from "vscode-languageserver-textdocument";
import { checkIfDiag, transformer } from "../helper/extractSmilarComponent";
import { locToRange } from "../helper/locToRange";

export class SendDiagnosticsHandler extends ContinuousOutputHandler<Diagnostic[], TextDocumentChangeEvent<TextDocument>> {
    concreteHandle(prevOutput: Diagnostic[], request: TextDocumentChangeEvent<TextDocument>): Diagnostic[] {
        connection.sendDiagnostics({uri: request.document.uri, diagnostics: prevOutput})
        return prevOutput;
    }
}
