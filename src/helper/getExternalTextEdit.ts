import { Range, TextEdit } from "vscode-languageserver";
import * as t from "@babel/types";
import traverse from "@babel/traverse";
import { findFunctionDeclarationOfRange } from "./findFunctionDeclarationOfRange";
import { isHookCallExpression } from "./isHookCallExpression";
import { locEndToPosition, locToRange } from "./locToRange";
import generate from "@babel/generator";

export function getExternalTextEdit(
    isIntoNewComponent: boolean,
    refs: Map<t.SourceLocation, t.SourceLocation[]>,
    ast: t.Node,
    range: Range,
    newId?: string
): TextEdit[] {
    const result: TextEdit[] = [];
    if (isIntoNewComponent) {
        // Create new component
        let callExpressionNode: t.CallExpression;
        const liftedComponent = findFunctionDeclarationOfRange(range, ast);
        traverse(ast, {
            CallExpression(path) {
                if (isHookCallExpression(range, path)) {
                    callExpressionNode = path.node;
                }
            },
        });
        const newComponentNode = t.functionDeclaration(
            t.identifier(newId!),
            [t.identifier("props")],
            t.blockStatement([
                t.variableDeclaration("const", [
                    t.variableDeclarator(
                        t.identifier("state"),
                        callExpressionNode
                    ),
                ]),
                t.returnStatement(
                    t.jsxElement(
                        t.jsxOpeningElement(
                            t.jsxIdentifier(liftedComponent.node.id.name),
                            [
                                t.jsxSpreadAttribute(t.identifier("props")),
                                t.jsxAttribute(
                                    t.jsxIdentifier("state"),
                                    t.jsxExpressionContainer(
                                        t.identifier("state")
                                    )
                                ),
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
        for (let value of refs.values()) {
            value.forEach((idLoc) => {
                result.push(TextEdit.replace(locToRange(idLoc), newId));
            });
        }
    } else {
        
    }
    return result;
}
