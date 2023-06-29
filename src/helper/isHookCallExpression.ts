import { Range } from "vscode-languageserver";
import * as t from "@babel/types";
import { NodePath } from "@babel/traverse";
import { IsRangeInLoc } from "./RangeLoc";

export function isHookCallExpression(
    range: Range,
    path: NodePath<t.CallExpression>
): boolean {
    return (
        IsRangeInLoc(range, path.node.loc) &&
        t.isIdentifier(path.node.callee) &&
        path.node.callee.name.startsWith("use")
    );
}
