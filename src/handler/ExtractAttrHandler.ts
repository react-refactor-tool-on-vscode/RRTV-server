import {checkAttributeExtract} from '../helper/extract-complex-attr-out-of-return-transformer'
import { BaseHandler, ContinuousOutputHandler } from "../interface/Handler";
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


export class ExtractAttrHandler extends ContinuousOutputHandler<(Command | CodeAction)[], CodeActionParams> {
    protected concreteHandle(prevOutput: (Command | CodeAction)[], request: CodeActionParams): (Command | CodeAction)[] {
        const uri = request.textDocument.uri;
        const document = documents.get(uri);
        const text = document.getText();
        const range = request.range;
        const index = document.offsetAt(range.start);
        const output = checkAttributeExtract(text, index);
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
        const change = new WorkspaceChange();
        const a = change.getTextEditChange(document);
        a.replace(newRange, output.newText);
        const codeAction:CodeAction = {
            title: "Extract attribute out of return",
            kind: CodeActionKind.RefactorRewrite,
            data: uri,
            edit: change.edit
        }
        return [...(prevOutput ?? []), codeAction]
    }
}