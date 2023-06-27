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
import {BaseHandler, ContinuousOutputHandler} from '../interface/Handler'
import { connection, documents } from '../server'

class AttrEditHandler extends ContinuousOutputHandler<
    (CodeAction | Command)[],
    CodeActionParams
> {
    protected concreteHandle(prevOutput: (CodeAction | Command)[], request: CodeActionParams): (CodeAction | Command)[] {
        const codeAction = generateCodeAction(request);
        if(codeAction === undefined) return [...prevOutput];
        else return [...prevOutput, codeAction];
    }
}

function generateCodeAction(request:CodeActionParams): CodeAction | undefined {
    const text = documents.get(request.textDocument.uri).getText(request.range);
    if(!hasJSXCode(text)) return;
    const options = [
        "same key same value",
        "same key different value",
        "different key same value",
        "different key different value"
    ]
    const codeAction:CodeAction = {
        title: 'Add attributes to labels in batches',
        kind: CodeActionKind.Refactor,
        data: request.textDocument.uri,
        command: Command.create(
            'provide attribute',
            'provide attribute',
            {
                document: request.textDocument.uri,
                range: request.range,
            },
            options,
        )
    }
    return codeAction;
}

function addTabStop(text:string):string | undefined {
    if(!hasJSXCode(text)) return;
    const regex = /<(\w+)((?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[\^'">\s]+))?)+\s*|\s*)>/g;
    const modifiedCode = text.replace(regex, (match, tagName, attributes) => {
        const attributeString = ' $1=$2';
        return `<${tagName}${attributes}${attributeString}>`;
    });
    return modifiedCode;
}

function hasJSXCode(code: string): boolean {
    const regex = /<([a-zA-Z][\w.-]*)\b/g;  // 匹配以大写字母开头的标签名称
    return regex.test(code);
}

async function generateSnippet(params:ExecuteCommandParams) {
    if(!params.arguments) return;
    const uri = params.arguments[0].document;
    const range = params.arguments[0].range;
    const document = documents.get(uri);
    const text = document.getText(range);
    const modifiedCode = addTabStop(text);
    if(!modifiedCode) return;
    const documentChanges = [
		TextDocumentEdit.create({
			uri:uri,
			version:document.version
		},
			[TextEdit.del(range)]
		)
	];
    await connection.workspace.applyEdit({
		documentChanges: documentChanges
	});
    await connection.sendRequest(ExecuteCommandRequest.method, {
        command: "run snippet",
		arguments:[range.start, modifiedCode]
    })
}

export {AttrEditHandler, addTabStop, generateSnippet};
