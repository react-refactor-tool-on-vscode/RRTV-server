import { Range, TextEdit } from "vscode-languageserver";
import * as t from "@babel/types";
import traverse from "@babel/traverse";
import { IsRangeInLoc } from "./RangeLoc";
import { locToRange } from "./locToRange";
import generate from "@babel/generator";

export function getTextEditsForStateLifting(
    ast: t.Node,
    range: Range,
    isParamSingleId: boolean,
    isIntoNewComponent: boolean,
    refs: Map<t.SourceLocation, t.SourceLocation[]>,
    newId?: string
): TextEdit[] {
    return [...getInternalTextEdit(isParamSingleId, ast, range)];
}

export function getInternalTextEdit(
    isParamSingleId: boolean,
    ast: t.Node,
    range: Range
) {
    const result: TextEdit[] = [];

    let singleIdParamName: string;

    traverse(ast, {
        enter(path) {
            if (t.isFunction(path.node) && IsRangeInLoc(range, path.node.loc)) {
                if (isParamSingleId) {
                    if (
                        path.node.params.length == 1 &&
                        t.isIdentifier(path.node.params[0])
                    ) {
                        singleIdParamName = path.node.params[0].name;
                    }
                } else {
                    const isRightParam =
                        path.node.params.length == 1 &&
                        t.isObjectPattern(path.node.params[0]);
                    if (isRightParam) {
                        const param = path.node.params[0] as t.ObjectPattern;
                        param.properties.push(
                            t.objectProperty(
                                t.identifier("state"),
                                t.identifier("state")
                            )
                        );
                        result.push(
                            TextEdit.replace(
                                locToRange(path.node.params[0].loc),
                                generate(param).code
                            )
                        );
                    }
                }
            }
        },
    });

    traverse(ast, {
        CallExpression(path) {
            if (
                IsRangeInLoc(range, path.node.loc) &&
                t.isIdentifier(path.node.callee) &&
                path.node.callee.name.startsWith("use")
            ) {
                if (isParamSingleId) {
                    result.push(
                        TextEdit.replace(
                            locToRange(path.node.loc),
                            generate(
                                t.memberExpression(
                                    t.identifier(singleIdParamName),
                                    t.identifier("state")
                                )
                            ).code
                        )
                    );
                } else {
                    result.push(
                        TextEdit.replace(
                            locToRange(path.node.loc),
                            generate(t.identifier("state")).code
                        )
                    );
                }
            }
        },
    });

    return result;
}
