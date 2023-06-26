import { BaseHandler, ContinuousOutputHandler } from "../interface/Handler";
import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import {
    CodeAction,
    CodeActionParams,
    Command,
    Range,
    TextDocumentChangeEvent,
    TextDocumentItem,
    TextDocuments,
    TextEdit,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

class PropFlattenCodeActionHandler extends ContinuousOutputHandler<
    (CodeAction | Command)[],
    CodeActionParams
> {
    protected concreteHandle(
        prevOutput: (CodeAction | Command)[],
        request: CodeActionParams
    ): (CodeAction | Command)[] {
        const codeAction = generateCodeAction(request);
        if (codeAction == undefined) return [...prevOutput];
        else return [...prevOutput, codeAction];
    }
}

function generateCodeAction(request: CodeActionParams): CodeAction | undefined {
    const documents: TextDocuments<TextDocument> = new TextDocuments(
        TextDocument
    );

    const range = request.range;
    const text = documents.get(request.textDocument.uri).getText();

    const ast = parse(text, {
        sourceType: "module",
        errorRecovery: true,
        plugins: ["jsx"],
    });

    const canBeDestructedResult = canBeDestructed(range, ast);
    if (!canBeDestructedResult) return undefined;
    else
        return CodeAction.create(
            "Prop Flatten",
            Command.create(
                "Prop Flatten",
                "rrtv.propFlatten",
                request.textDocument.uri
            )
        );
}

// TODO
function canBeDestructed(range: Range, ast: t.Node): boolean {
    return false;
}

// TODO: Implement generateTextEdit
function generateTextEdit(): TextEdit[] {
    return [];
}

export { PropFlattenCodeActionHandler };
