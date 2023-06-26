import { BaseHandler, ContinuousOutputHandler } from "../interface/Handler";
import { parse } from "@babel/parser";
import traverse, { NodePath, TraverseOptions } from "@babel/traverse";
import * as t from "@babel/types";
import {
    CodeAction,
    CodeActionKind,
    CodeActionParams,
    Command,
    Range,
    TextDocumentChangeEvent,
    TextDocumentItem,
    TextDocuments,
    TextEdit,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { IsRangeInLoc } from "../helper/RangeLoc";

import { connection, documents } from "../server";
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
    if (!canBeDestructedResult.beDestructed) return undefined;
    else
        return CodeAction.create(
            "Prop Flatten",
            Command.create(
                "Prop Flatten",
                "rrtv.propFlatten",
                request.textDocument.uri,
                canBeDestructedResult.identifierName
            ),
            CodeActionKind.RefactorRewrite
        );
}

// TODO
function canBeDestructed(
    range: Range,
    ast: t.Node
): { beDestructed: boolean; identifierName: string } {
    let isParamSelected: boolean = false;
    let identifierName: string;
    let hasTrailing: boolean = false;

    const findIdentifier: TraverseOptions<t.Node> = {
        Identifier(path) {
            if (IsRangeInLoc(range, path.node.loc)) {
                if (t.isObjectProperty(path.parent)) {
                    if (
                        t.isIdentifier(path.parent.value) &&
                        path.node.name ==
                            (path.parent.value as t.Identifier).name
                    ) {
                        isParamSelected = true;
                        identifierName = path.node.name;
                    }
                } else if (t.isArrayPattern(path.parent)) {
                    isParamSelected = true;
                    identifierName = path.node.name;
                }
            }
        },
    };

    const checkHasTrailing: TraverseOptions<t.Node> = {
        Identifier(path) {
            if (
                t.isMemberExpression(path.parent) &&
                t.isIdentifier(path.parent.object) &&
                (path.parent.object as t.Identifier).name == path.node.name
            ) {
                hasTrailing = true;
            }
        },
    };

    traverse(ast, {
        enter(path) {
            if (t.isFunction(path.node) && IsRangeInLoc(range, path.node.loc)) {
                let index: number;
                path.node.params.forEach((param, id) => {
                    if (IsRangeInLoc(range, param.loc)) {
                        index = id;
                    }
                });

                const paramChildPath = path.get(
                    `params.${index}`
                ) as NodePath<t.Node>;

                if (t.isIdentifier(paramChildPath.node)) {
                    isParamSelected = true;
                    identifierName = paramChildPath.node.name;
                } else {
                    paramChildPath.traverse(findIdentifier);
                }

                if (!isParamSelected) return; // Ensure that the range is on a param.

                // Check if it's references has trailing ones.
                const bodyPath = path.get("body") as NodePath<t.Node>;
                bodyPath.traverse(checkHasTrailing);
            }
        },
    });
    return {
        beDestructed: hasTrailing,
        identifierName: identifierName,
    };
}

// TODO: Implement generateTextEdit
function generateTextEdit(): TextEdit[] {
    return [];
}

export { PropFlattenCodeActionHandler, canBeDestructed };
