import traverse, { NodePath, TraverseOptions } from "@babel/traverse";
import * as t from "@babel/types";
import { Range } from "vscode-languageserver";
import { IsRangeInLoc } from "../helper/RangeLoc";
import { isHeadIdOfMemberExpr } from "../helper/IsHeadIdOfMemberExpr";

export function canBeDestructed(
    range: Range,
    ast: t.Node
): { beDestructed: boolean; identifierName: string; } {
    let isParamSelected: boolean = false;
    let identifierName: string;
    let hasTrailing: boolean = false;

    const findIdentifier: TraverseOptions<t.Node> = {
        Identifier(path) {
            if (IsRangeInLoc(range, path.node.loc)) {
                if (t.isObjectProperty(path.parent)) {
                    if (t.isIdentifier(path.parent.value) &&
                        path.node.name ==
                        (path.parent.value as t.Identifier).name) {
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
            if (isHeadIdOfMemberExpr(path)) {
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

                if (index == undefined) return;

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