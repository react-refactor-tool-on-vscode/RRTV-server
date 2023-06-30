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
import * as j from "jscodeshift"

export class SimilarComponentDiagHandler extends ContinuousOutputHandler<Diagnostic[], TextDocumentChangeEvent<TextDocument>> {
    concreteHandle(prevOutput: Diagnostic[], request: TextDocumentChangeEvent<TextDocument>): Diagnostic[] {
        const document = request.document;
        const res = checkIfDiag(document.getText());
        if(!res.diag) {
            return prevOutput;
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
            diagnostic.data = ['extract similar component', document.getText(), tmp];
            diagnostics.push(diagnostic);
        }
        return [...prevOutput, ...diagnostics]
    }
}

export class SimilarComponentCAHandler extends ContinuousOutputHandler< 
    (CodeAction | Command)[],
    CodeActionParams
> {
    protected concreteHandle(prevOutput: (CodeAction | Command)[], request: CodeActionParams): (CodeAction | Command)[] {
        connection.window.showInformationMessage("enter")
        const codeAction = generateCodeAction(request);
        if (codeAction) {
            connection.window.showInformationMessage("code action: " + JSON.stringify(codeAction))
            return [...prevOutput, codeAction];
        } else return prevOutput;
    }
}

function generateCodeAction(request:CodeActionParams): CodeAction {
    if(request.context.diagnostics.length == 0) return null;
    const data = request.context.diagnostics[0].data ?? [];
    if(data[0] != 'extract similar component') {return null;}
    const uri = request.textDocument.uri;
    const root = j(data[1]);
    const res = checkIfDiag(data[1]);
    const elements = res.cache.result[data[2][0]]
    const newText = transformer(root, elements, data[2][1]);
    const change = new WorkspaceChange();
    const a = change.getTextEditChange(uri);
    a.replace(
        Range.create(
            Position.create(0, 0),
            Position.create(500, 200)
        ),
        newText
    );
    const codeAction = CodeAction.create(
        "extract similar component",
        change.edit,
        CodeActionKind.QuickFix,
    )
    codeAction.isPreferred = true;
    return codeAction;
}