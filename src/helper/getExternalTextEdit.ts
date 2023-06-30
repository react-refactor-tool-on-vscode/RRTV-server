import { Range, TextEdit } from "vscode-languageserver";
import * as t from "@babel/types";
import traverse from "@babel/traverse";
import { findFunctionDeclarationOfRange } from "./findFunctionDeclarationOfRange";
import { isHookCallExpression } from "./isHookCallExpression";
import {
    locEndToPosition,
    locStartAfterToPosition,
    locToRange,
} from "./locToRange";
import generate from "@babel/generator";
import * as _ from "lodash";

export function getExternalTextEdit(
    isIntoNewComponent: boolean,
    refs: Map<t.SourceLocation, t.SourceLocation[]>,
    ast: t.Node,
    range: Range,
    newId?: string
): TextEdit[] {
    const result: TextEdit[] = [];
    let callExpressionNode: t.CallExpression;
    const liftedComponent = findFunctionDeclarationOfRange(range, ast);
    traverse(ast, {
        CallExpression(path) {
            if (isHookCallExpression(range, path)) {
                callExpressionNode = path.node;
            }
        },
    });
    const newStateNode = t.variableDeclaration("const", [
        t.variableDeclarator(t.identifier("state"), callExpressionNode),
    ]);
    const newStateAttr = t.jsxAttribute(
        t.jsxIdentifier("state"),
        t.jsxExpressionContainer(t.identifier("state"))
    );
    if (isIntoNewComponent) {
        // Create new component
        const newComponentNode = t.functionDeclaration(
            t.identifier(newId!),
            [t.identifier("props")],
            t.blockStatement([
                newStateNode,
                t.returnStatement(
                    t.jsxElement(
                        t.jsxOpeningElement(
                            t.jsxIdentifier(liftedComponent.node.id.name),
                            [
                                t.jsxSpreadAttribute(t.identifier("props")),
                                newStateAttr,
                            ],
                            true
                        ),
                        null,
                        []
                    )
                ),
            ])
        );
        result.push(
            TextEdit.insert(
                locEndToPosition(liftedComponent.node.loc),
                generate(newComponentNode).code + "\n"
            )
        );
        // Traverse refs and change identifier
        for (const value of refs.values()) {
            value.forEach((idLoc) => {
                result.push(TextEdit.replace(locToRange(idLoc), newId));
            });
        }
    } else {
        // Traverse parent component: add state and modify jsx.
        for (const [key, value] of refs) {
            traverse(ast, {
                FunctionDeclaration(path) {
                    if (
                        key.start.line == path.node.id.loc.start.line &&
                        key.start.column == path.node.id.loc.start.column &&
                        key.end.line == path.node.id.loc.end.line &&
                        key.end.column == path.node.id.loc.end.column
                    ) {
                        const blockStartLoc = path.node.body.loc;
                        result.push(
                            TextEdit.insert(
                                locStartAfterToPosition(blockStartLoc),
                                "\n" + generate(newStateNode).code
                            )
                        );
                    }
                },
            });
            value.forEach((jsxIdentifierLoc) => {
                result.push(
                    TextEdit.insert(
                        locEndToPosition(jsxIdentifierLoc),
                        "\n" + generate(newStateAttr).code + "\n"
                    )
                );
            });
        }
    }
    return result;
}
