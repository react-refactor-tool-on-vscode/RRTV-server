import traverse, { NodePath } from "@babel/traverse";
import { Range } from "vscode-languageserver";
import * as t from "@babel/types";
import { IsRangeInLoc } from "./RangeLoc";

function findFunctionDeclarationOfRange(range: Range, ast: t.Node): NodePath<t.FunctionDeclaration> {
    let funcDecl: NodePath<t.FunctionDeclaration>;
    traverse(ast, {
        enter(path) {
            if (
                t.isFunctionDeclaration(path.node) &&
                IsRangeInLoc(range, path.node.loc)
            ) {
                funcDecl = path as NodePath<t.FunctionDeclaration>;
            }
        },
    });
    return funcDecl;
}

export { findFunctionDeclarationOfRange };
