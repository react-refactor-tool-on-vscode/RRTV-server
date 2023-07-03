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
import { getFuncPatternParam, HookResult, replaceIdentifier } from "../helper/getFuncPatternParam";

const hookPattern = /use[A-Z][a-zA-Z]*\(([^)]+)\)/g;
const initParamRegex = /init\s*[,)]/;
const parameterRegex = /[^\s,]+/g;

export class HookParamDiagHandler extends ContinuousOutputHandler<Diagnostic[], TextDocumentChangeEvent<TextDocument>> {
    concreteHandle(prevOutput: Diagnostic[], request: TextDocumentChangeEvent<TextDocument>): Diagnostic[] {
        const document = request.document;
        const text = document.getText()
        if(!hookPattern.test(text)) {
            return prevOutput;
        }
        const diagnostics = diagnosticGenerator(text, document);
        return [...prevOutput, ...diagnostics]
    }
}

// generate diagnostics depend on document for hook param 
function diagnosticGenerator(text:string, document:TextDocument):Diagnostic[] {
    let match:RegExpExecArray | null;
        const diagnostics:Diagnostic[] = [];
        while((match = hookPattern.exec(text)) != null) {
            const range = Range.create(document.positionAt(match.index),  document.positionAt(match.index))
            if(match[1]) {
                const results = getFuncPatternParam(text, range);
                if(results.length == 0) return [];
                for(const set of results) {     
                    if(set.result.includes(match[1].trim()) && match[1].trim().substring(0, 4) != 'init') {
                        const diagnostic = Diagnostic.create(
                            set.paramRange,
                            "Hook parameter should begin with 'init'",
                            DiagnosticSeverity.Warning,
                        );
                        const oldCode = document.getText(set.funcRange);
                        console.log("old code is " + oldCode)
                        diagnostic.data = ['hook param diag', match[1], set.funcRange, oldCode];
                        diagnostics.push(diagnostic);
                    }
                
                }
            }
        }
    return diagnostics;
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

// generate diagnostics depend on document for hook param 
function generateCodeAction(param:CodeActionParams): CodeAction {
    if(param.context.diagnostics.length == 0) return null;
    const data = param.context.diagnostics[0].data ?? [];
    if(data[0] != 'hook param diag') {return null;}
    const change = new WorkspaceChange();
    const name:string = 'init' + data[1].substring(0, 1).toUpperCase() + data[1].substring(1, 4);
    const newCode = replaceIdentifier(data[3], data[1], name)
    const a = change.getTextEditChange(param.textDocument.uri);
    a.replace(data[2], newCode);
    const codeAction = CodeAction.create(
        "Fix Hook Parameter",
        change.edit,
        CodeActionKind.QuickFix
    )
    // codeAction.isPreferred = true;
    return codeAction;
}





  
  
  
  
  