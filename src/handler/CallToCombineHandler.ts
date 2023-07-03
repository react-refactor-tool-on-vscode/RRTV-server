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
    Position,
    WorkspaceChange,
} from "vscode-languageserver/node";
import { BaseHandler, ContinuousOutputHandler } from "../interface/Handler";
import { connection, documents } from "../server";
import { DocumentUri } from "vscode-languageserver-textdocument";
import { hasJSXCode, addTabStop } from "../helper/attrInsertor";
import { transformer } from "../helper/callToCombine";

export class CallToCombineHandler extends ContinuousOutputHandler<
    (CodeAction | Command)[],
    CodeActionParams
> {
    protected concreteHandle(
        prevOutput: (CodeAction | Command)[],
        request: CodeActionParams
    ): (CodeAction | Command)[] {
        try {
            const range = request.range;
            const uri = request.textDocument.uri;
            const document = documents.get(uri);
            const result = transformer(
                document.getText(),
                document.offsetAt(range.start)
            );
            console.log("result::: ", result);
            if (!result.check) {
                return prevOutput;
            }
            const change = new WorkspaceChange();
            const a = change.getTextEditChange(uri);
            a.replace(
                Range.create(Position.create(0, 0), Position.create(1000, 300)),
                result.newText
            );
            const codeAction = CodeAction.create(
                "Component Call to Component Combine",
                change.edit,
                CodeActionKind.RefactorRewrite
            );
            return [...(prevOutput ?? []), codeAction];
        } catch (error) {
            console.log(JSON.stringify(error));
        }
        return [...(prevOutput ?? [])];
    }
}
