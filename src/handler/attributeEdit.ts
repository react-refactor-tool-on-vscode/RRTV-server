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
} from "vscode-languageserver/node";
import { BaseHandler, ContinuousOutputHandler } from '../interface/Handler'
import { connection, documents } from '../server'
import { DocumentUri } from "vscode-languageserver-textdocument";
import { hasJSXCode, addTabStop } from "../helper/attrInsertor";

const commandName = "provide-attribute.1"
class AttrEditHandler extends ContinuousOutputHandler<
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

class AttrEditExecuteCommandHandler extends BaseHandler<void, ExecuteCommandParams> {
    handle(prevOutput: void, request: ExecuteCommandParams): void {
        if(request.command == commandName) {
            const textDocument = documents.get(request.arguments[0]);
            const range:Range = request.arguments[1];
            const option:number = request.arguments[2];
            if(option > 4) {return;}
            const text = textDocument.getText(range);
            const modifiedCode = addTabStop(text, option);
            if (!modifiedCode) return;
          
            connection.sendRequest(ExecuteCommandRequest.method, {
                command: "provide-attribute.2",
                arguments: [textDocument.uri, range, modifiedCode]
            }) 
            return;
        } else this.nextHandler.handle(null, request);
    }
}

function generateCodeAction(request: CodeActionParams): CodeAction | undefined {
    const text = documents.get(request.textDocument.uri).getText(request.range);
    if (!hasJSXCode(text)) return;
    const options = [
        "same key same value",
        "same key different value",
        "different key same value",
        "different key different value"
    ]
    const codeAction: CodeAction = {
        title: 'Add attributes to labels in batches',
        kind: CodeActionKind.Refactor,
        data: request.textDocument.uri,
        command: Command.create(
            'provide-attribute.0',
            'provide-attribute.0',
            request.textDocument.uri,
            request.range,
            options,
        )
    }
    return codeAction;
}

export { AttrEditHandler, addTabStop, AttrEditExecuteCommandHandler};
