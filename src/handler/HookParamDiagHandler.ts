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
} from "vscode-languageserver/node";
import { BaseHandler, ContinuousOutputHandler } from '../interface/Handler'
import { connection, documents } from '../server'
import { TextDocument } from "vscode-languageserver-textdocument";

const hookPattern = /use[A-Z][a-zA-Z]*\(([^)]+)\)/g;
const initParamRegex = /init\s*[,)]/;
const PromblemLimit = 1000;

export class HookParamDiagHandler extends BaseHandler<void, TextDocumentChangeEvent<TextDocument>> {
    handle(prevOutput: void, request: TextDocumentChangeEvent<TextDocument>): void {
        const document = request.document;
        const text = document.getText()
        connection.window.showInformationMessage(text);
        if(!hookPattern.test(text)) {
            this.nextHandler.handle(null, request);
            return;
        }
        let match:RegExpExecArray | null;
        let checks = 0;
        const diagnostics:Diagnostic[] = [];
        while((match = hookPattern.exec(text)) !== null && checks < PromblemLimit) {
            if(!initParamRegex.test(match[1])) {
                const diagnostic: Diagnostic = {
                    severity: DiagnosticSeverity.Warning,
                    range: {
                        start: document.positionAt(match.index),
                        end: document.positionAt(match.index + match[0].length)
                    },
                    message: 'Param of hook should be named "init"',
                    source: 'stellaron hunter',
                }
                diagnostics.push(diagnostic);
                checks ++;
            }
        }
        connection.sendDiagnostics({uri:document.uri, diagnostics});
        this.nextHandler.handle(null, request);
    }
}