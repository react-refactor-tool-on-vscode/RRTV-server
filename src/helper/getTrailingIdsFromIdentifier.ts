import traverse, { NodePath, TraverseOptions } from "@babel/traverse";
import * as t from "@babel/types";
import { Range } from "vscode-languageserver";
import { IsRangeInLoc } from "./RangeLoc";
import { isHeadIdOfMemberExpr } from "./IsHeadIdOfMemberExpr";

export function getTrailingIdsFromIdentifier(
    ast: t.Node,
    range: Range,
    identifierName: string
): { ids: Array<string[]>; memberExprLocs: t.SourceLocation[] } {
    let trailingIds: Array<string[]> = new Array<string[]>();
    let locs: Array<t.SourceLocation> = new Array<t.SourceLocation>();
    let isRangeValid: boolean = false;

    const findAllTrailing: TraverseOptions<t.Node> = {
        Identifier(path) {
            if (
                isHeadIdOfMemberExpr(path) &&
                path.node.name == identifierName
            ) {
                trailingIds.push([]);
                let index: number = trailingIds.length - 1;
                let currentPath = path as NodePath<t.Node>;
                while (t.isMemberExpression(currentPath.parent)) {
                    if (
                        t.isIdentifier(
                            (currentPath.parent as t.MemberExpression).property
                        )
                    ) {
                        trailingIds[index].push(
                            (
                                (currentPath.parent as t.MemberExpression)
                                    .property as t.Identifier
                            ).name
                        );
                        currentPath = currentPath.parentPath;
                    }
                }
                locs.push(currentPath.node.loc);
            }
        },
    };

    const checkRange: TraverseOptions<t.Node> = {
        Identifier(path) {
            if (
                IsRangeInLoc(range, path.node.loc) &&
                path.node.name == identifierName
            ) {
                isRangeValid = true;
                return;
            }
        },
    };

    traverse(ast, {
        enter(path) {
            if (t.isFunction(path.node) && IsRangeInLoc(range, path.node.loc)) {
                const funcBodyPath = path.get("body") as NodePath<t.Node>;
                // Range is promised to be the same of the one in CodeAction so there's only a simple check which is unnecessary.
                path.traverse(checkRange);
                if (!isRangeValid) return;
                funcBodyPath.traverse(findAllTrailing);
            }
        },
    });

    return { ids: trailingIds, memberExprLocs: locs };
}
