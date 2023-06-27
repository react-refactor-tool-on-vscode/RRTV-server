import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export function isHeadIdOfMemberExpr(path: NodePath<t.Identifier>) {
    return t.isMemberExpression(path.parent) &&
        t.isIdentifier(path.parent.object) &&
        (path.parent.object as t.Identifier).name == path.node.name;
}
