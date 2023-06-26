import * as node from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import { BaseHandler } from "../interface/Handler";

import { textToAst, dataGenerator, modifier } from './utils-extract-component';

export class ExtractComponentHandler extends BaseHandler<node.CodeAction[], node.CodeActionParams> {
    handle(prevOutput: node.CodeAction[], request: node.CodeActionParams): node.CodeAction[] {
        const documents: node.TextDocuments<TextDocument> = new node.TextDocuments(TextDocument)
        const document = documents.get(request.textDocument.uri)
        const text = document.getText(request.range)
        const ast = textToAst(text)
        const { valid, specified } = dataGenerator(ast)
        if (!valid) {
            return [...prevOutput]
        }

        const codeAction = node.CodeAction.create(
            "Extract Component",
            node.Command.create(
                "Extract Component",
                "rrtv.extractComponent",
                [{ ast, specified }] //{newText, range} = modifier(ast, specified)
            ),
            node.CodeActionKind.RefactorExtract
        );

        const {newText, _range} = modifier(ast, specified)
        const change: node.WorkspaceChange = new node.WorkspaceChange()
        const a = change.getTextEditChange(document)
        a.replace(node.Range.create(_range.start, _range.end), newText)

        codeAction.edit = change.edit
        return [...prevOutput, codeAction]
    }
}