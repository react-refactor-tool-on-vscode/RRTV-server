import {checkExpressExtract} from '../helper/extract-complex-exprs-out-of-return-transformer'
import { checkAttributeExtract } from '../helper/extract-complex-attr-out-of-return-transformer';
import { ContinuousOutputHandler } from "../interface/Handler";
import {
    CodeAction,
    CodeActionKind,
    CodeActionParams,
    Command,
    ExecuteCommandParams,
    Range,
    TextDocumentChangeEvent,
    TextDocumentEdit,
    TextDocumentItem,
    TextDocuments,
    TextEdit,
    WorkspaceChange,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { connection, documents } from "../server";
import { networkInterfaces } from 'os';


abstract class ExtractComplexHandler extends ContinuousOutputHandler<(Command | CodeAction)[], CodeActionParams> {
    protected concreteHandle(prevOutput: (Command | CodeAction)[], request: CodeActionParams): (Command | CodeAction)[] {
        const uri = request.textDocument.uri;
        const document = documents.get(uri);
        const text = document.getText();
        const range = request.range;
        const index = document.offsetAt(range.start);
        const output = this.check(text, index);
        if (output.newText === undefined) {
            return prevOutput
        }
        const newRange = {
            start: {
                line: output.newRange.start.line - 1,
                character: output.newRange.start.column
            },
            end: {
                line: output.newRange.end.line - 1,
                character: output.newRange.end.column
            }
        }

        const codeAction:CodeAction = this.getCodeAction(output.newText, newRange);
        return [...(prevOutput ?? []), codeAction]
    }

    abstract check(text:string, index:number):{newText:string, newRange:any}
    abstract getCodeAction(newText:string, newRange): CodeAction
}

export class ExtractAttrHandler extends ExtractComplexHandler {
    check(text:string, index:number):{ newText: string; newRange: Range; } {
        return checkAttributeExtract(text, index);
    }
    getCodeAction(newText: string, newRange: any): CodeAction {
        return CodeAction.create(
            "Extract attribute out of return",
             Command.create(
                "extract-attribute.0",
                "extract-attribute.0",
                newText,
                newRange,
             ),
             CodeActionKind.RefactorRewrite,
        )
    }
}

export class ExtractExprHandler extends ExtractComplexHandler {
    check(text: string, index: number): { newText: string; newRange: Range; } {
        return checkExpressExtract(text, index);
    }
    getCodeAction(newText: string, newRange: any): CodeAction {
        return CodeAction.create(
            "Extract express out of return",
             Command.create(
                "extract-attribute.0",
                "extract-attribute.0",
                newText,
                newRange,
             ),
             CodeActionKind.RefactorRewrite,
        )
    }
}

