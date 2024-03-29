import { Range, TextEdit } from "vscode-languageserver";
import * as t from "@babel/types";
import traverse from "@babel/traverse";
import { IsRangeInLoc } from "./RangeLoc";
import { locToRange } from "./locToRange";
import generate from "@babel/generator";
import { isHookCallExpression } from "./isHookCallExpression";

export function getInternalTextEdit(
    isParamSingleId: boolean,
    ast: t.Node,
    range: Range
): TextEdit[] {
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
                    if (path.node.params.length == 0) {
                        const param: t.Node = t.objectPattern([
                            t.objectProperty(
                                t.identifier("state"),
                                t.identifier("state")
                            ),
                        ]);

                        let parenRange: Range;
                        if (t.isFunctionDeclaration(path.node)) {
                            const idRange = locToRange(
                                (path.node as t.FunctionDeclaration).id.loc
                            );
                            const bodyRange = locToRange(path.node.body.loc);
                            parenRange = Range.create(
                                idRange.end.line,
                                idRange.end.character,
                                bodyRange.start.line,
                                bodyRange.start.character
                            );
                        } else {
                            const funcRange = locToRange(path.node.loc);
                            const bodyRange = locToRange(path.node.body.loc);
                            parenRange = Range.create(
                                funcRange.start.line,
                                funcRange.start.character,
                                bodyRange.start.line,
                                bodyRange.start.character
                            );
                        }
                        result.push(
                            TextEdit.replace(
                                parenRange,
                                "(" + generate(param).code + ")"
                            )
                        );
                    } else {
                        const isRightParam =
                            path.node.params.length == 1 &&
                            t.isObjectPattern(path.node.params[0]);
                        if (isRightParam) {
                            const param = path.node
                                .params[0] as t.ObjectPattern;
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
            }
        },
    });

    traverse(ast, {
        CallExpression(path) {
            if (isHookCallExpression(range, path)) {
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
