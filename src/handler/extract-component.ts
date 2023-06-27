import * as node from "vscode-languageserver/node";

import {documents, connection} from '../server'

import { BaseHandler, ContinuousOutputHandler } from "../interface/Handler";

const { textToAst, dataGenerator, modifier } = require('./utils-extract-component'); 

export class ExtractComponentHandler extends ContinuousOutputHandler<node.CodeAction[], node.CodeActionParams> {
    concreteHandle(prevOutput: node.CodeAction[], request: node.CodeActionParams): node.CodeAction[] {
        const document = documents.get(request.textDocument.uri)
        const text = document.getText(request.range)
        const ast = textToAst(text)
        const { valid, specified } = dataGenerator(ast)
        if (!valid) {
            return [...prevOutput]
        }


        const codeAction:node.CodeAction = {
            title: "Extract-Component",
            kind:   node.CodeActionKind.RefactorExtract,
            data: document.uri
        }

        const {newText, _range} = modifier(ast, specified)
       
        const change: node.WorkspaceChange = new node.WorkspaceChange()
        const a = change.getTextEditChange(document)
        connection.window.showInformationMessage(newText);
        a.replace(request.range, newText)
        codeAction.edit = change.edit
        connection.window.showInformationMessage(JSON.stringify(codeAction));
        return [...prevOutput, codeAction]
    }
}