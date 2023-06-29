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
import { getFuncPatternParam } from "../helper/getFuncPatternParam";
import { range } from "lodash";

const hookPattern = /use[A-Z][a-zA-Z]*\(([^)]+)\)/g;
const initParamRegex = /init\s*[,)]/;
const parameterRegex = /[^\s,]+/g;
const PromblemLimit = 1000;

export class HookParamDiagHandler extends BaseHandler<void, TextDocumentChangeEvent<TextDocument>> {
    handle(prevOutput: void, request: TextDocumentChangeEvent<TextDocument>): void {
        const document = request.document;
        const text = document.getText()
        if(!hookPattern.test(text)) {
            this.nextHandler.handle(null, request);
            return;
        }
        let match:RegExpExecArray | null;
        let checks = 0;
        const diagnostics:Diagnostic[] = [];
        while((match = hookPattern.exec(text)) !== null && checks < PromblemLimit) {
            const range = Range.create(document.positionAt(match.index),  document.positionAt(match.index))
            if(match[1]) {
                const pattern = getFuncPatternParam(text, range);
                if(match[1] == pattern.trim() && match[1] != 'init') {
                    checks ++;
                    const diagnostic = Diagnostic.create(
                        Range.create(document.positionAt(match.index),  document.positionAt(match.index + match[0].length)),
                        "Hook parameter should be named 'init'",
                        DiagnosticSeverity.Warning,
                    );
                    diagnostic.data = ['wow!']
                    diagnostics.push(diagnostic);
                }
            }
        }
        connection.sendDiagnostics({uri:document.uri, diagnostics});
        this.nextHandler.handle(null, request);
    }
}

export class HookParamFixHandler extends ContinuousOutputHandler< 
    (CodeAction | Command)[],
    CodeActionParams
> {
    protected concreteHandle(prevOutput: (CodeAction | Command)[], request: CodeActionParams): (CodeAction | Command)[] {
        const codeAction = generateCodeAction(request);
        if (codeAction) {
            return [...(prevOutput ?? []), codeAction];
        } else return prevOutput;
    }
}

function generateCodeAction(param:CodeActionParams): CodeAction {
    if(param.context.diagnostics.length == 0) return null;
    const data = param.context.diagnostics[0].data ?? [];
    const change = new WorkspaceChange();
    const a = change.getTextEditChange(param.textDocument.uri);
    a.replace(param.context.diagnostics[0].range, data[0]);
    const codeAction = CodeAction.create(
        "Fix Hook Parameter",
        change.edit,
        CodeActionKind.QuickFix
    )
    codeAction.isPreferred = true;
    return codeAction;
}





  
  
  
  
  