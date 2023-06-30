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

export class SimilarComponentDiagHandler extends BaseHandler<void, TextDocumentChangeEvent<TextDocument>> {
    handle(prevOutput: void, request: TextDocumentChangeEvent<TextDocument>): void {
        const document = request.document;
        const res = checkIfDiag(document.getText());
        if(!res.diag) {
            if(this.nextHandler) {
                this.nextHandler.handle(null, request);
            }
            return;
        }
        const diagnostics:Diagnostic[] = []
        for(const key in res.cache.range) {
            const range = res.cache.range[key];
            const diagnostic = Diagnostic.create(
                range, 
                "Similar component which can be extracted",
                DiagnosticSeverity.Warning
            );
            const tmp = key.split('.');
            const elements = res.cache.result[tmp[0]];
            const elementIndex = tmp[1]
            diagnostic.data = ['extract similar component', res.cache.root, elements, elementIndex];
            diagnostics.push(diagnostic);
        }
        connection.sendDiagnostics({uri:document.uri, diagnostics:diagnostics});
        if(this.nextHandler){
            this.nextHandler.handle(null, request);   
        }
    }
}

export class SimilarComponentCAHandler extends ContinuousOutputHandler< 
    (CodeAction | Command)[],
    CodeActionParams
> {
    protected concreteHandle(prevOutput: (CodeAction | Command)[], request: CodeActionParams): (CodeAction | Command)[] {
        const codeAction = generateCodeAction(request);
        if(!codeAction) return prevOutput;
        return [...(prevOutput ?? []), codeAction];
    }
}

function generateCodeAction(request:CodeActionParams): CodeAction {
    if(request.context.diagnostics.length == 0) return null;
    const data = request.context.diagnostics[0].data ?? [];
    if(data[0] != 'extract similar component') {return null;}
    const uri = request.textDocument.uri;
    const newText = transformer(data[1], data[2], data[3]);
    const change = new WorkspaceChange();
    const a = change.getTextEditChange(uri);
    a.replace(Range.create(
            Position.create(0, 0),
            Position.create(Infinity, Infinity)
        ), 
        newText
    );
    const codeAction =  CodeAction.create(
        "extract similar component",
        change.edit,
        CodeActionKind.QuickFix,
    )
    codeAction.isPreferred = true;
    return codeAction;
}