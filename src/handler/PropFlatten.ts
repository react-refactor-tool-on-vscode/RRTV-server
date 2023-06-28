import { BaseHandler, ContinuousOutputHandler } from "../interface/Handler";
import { parse } from "@babel/parser";
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
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import traverse from "@babel/traverse";

import { connection, documents } from "../server";
import parseToAst from "../helper/ParseToAst";
import { getTrailingIdsFromIdentifier } from "../helper/getTrailingIdsFromIdentifier";
import { canBeDestructed } from "../helper/canBeDestructed";
import { SourceLocation } from "@babel/types";
import { IsRangeInLoc } from "../helper/RangeLoc";
import { idsToTextEdit } from "../helper/idsToTextEdit";
import { locToRange } from "../helper/locToRange";

const commandName = "rrtv.propFlatten";

class PropFlattenCodeActionHandler extends ContinuousOutputHandler<
    (CodeAction | Command)[],
    CodeActionParams
> {
    protected concreteHandle(
        prevOutput: (CodeAction | Command)[],
        request: CodeActionParams
    ): (CodeAction | Command)[] {
        const codeAction = generateCodeAction(request);
        if (codeAction) {
            return [...(prevOutput ?? []), codeAction];
        } else return prevOutput;
    }
}

class PropFlattenExecuteCommandHandler extends BaseHandler<
    void,
    ExecuteCommandParams
> {
    handle(prevOutput: void, request: ExecuteCommandParams): void {
        if (request.command == commandName) {
            // Get input.
            const textDocument = documents.get(request.arguments[0]);
            const range: Range = request.arguments[1];
            const identifierName = request.arguments[2];
            const isDirectParam = request.arguments[3];
            // Send edits.
            connection.workspace.applyEdit({
                documentChanges: [
                    TextDocumentEdit.create(
                        {
                            uri: textDocument.uri,
                            version: textDocument.version,
                        },
                        generateTextEdit(textDocument, range, identifierName, isDirectParam)
                    ),
                ],
            });
            return;
        } else this.nextHandler.handle(null, request);
    }
}

function generateCodeAction(request: CodeActionParams): CodeAction | undefined {
    const range = request.range;
    const text = documents.get(request.textDocument.uri).getText();

    const ast = parseToAst(text);

    const canBeDestructedResult = canBeDestructed(range, ast);
    if (!canBeDestructedResult.beDestructed) return undefined;
    else
        return CodeAction.create(
            "Prop Flatten",
            Command.create(
                "Prop Flatten",
                commandName,
                request.textDocument.uri,
                request.range,
                canBeDestructedResult.identifierName,
                canBeDestructedResult.isDirectParam
            ),
            CodeActionKind.RefactorRewrite
        );
}

function generateTextEdit(
    document: TextDocument,
    range: Range,
    identifierName: string,
    isDirectParam: boolean
): TextEdit[] {
    const code = document.getText();
    const ast = parseToAst(code);
    let paramLoc: SourceLocation;
    traverse(ast, {
        Identifier(path) {
            if (IsRangeInLoc(range, path.node.loc)) {
                paramLoc = path.node.loc;
                return;
            }
        },
    });
    const trailingIds = getTrailingIdsFromIdentifier(
        ast,
        range,
        identifierName
    );

    return idsToTextEdit(
        document,
        Range.create(
            paramLoc.start.line - 1,
            paramLoc.start.column,
            paramLoc.end.line - 1,
            paramLoc.end.column
        ),
        trailingIds.ids,
        trailingIds.memberExprLocs.map((loc) => locToRange(loc)),
        isDirectParam
    );
}

export { PropFlattenCodeActionHandler, PropFlattenExecuteCommandHandler };
