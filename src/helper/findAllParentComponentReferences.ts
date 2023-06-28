import { Range } from "vscode-languageserver";
import parseToAst from "./ParseToAst";
import traverse, { NodePath, TraverseOptions } from "@babel/traverse";
import * as t from "@babel/types";
import { IsRangeInLoc } from "./RangeLoc";

export function findAllParentComponentReferences(
    code: string,
    range: Range
): Map<t.SourceLocation, t.SourceLocation[]> {
    const ast = parseToAst(code);
    const result = new Map<t.SourceLocation, t.SourceLocation[]>();
    let idsForFunction = [];
    let parentComponentLoc: t.SourceLocation;
    let liftedName: string;
    traverse(ast, {
        enter(path) {
            if (
                t.isFunctionDeclaration(path.node) &&
                IsRangeInLoc(range, path.node.loc)
            ) {
                liftedName = path.node.id.name;
            }
        },
    });

    const findAllRefs: TraverseOptions = {
        JSXIdentifier(path) {
            if (path.node.name == liftedName) {
                idsForFunction.push(path.node.loc);
            }
        },
    };

    traverse(ast, {
        enter(path) {
            if (t.isFunctionDeclaration(path.node)) {
                parentComponentLoc = path.node.id.loc;
                (path.get("body") as NodePath<t.Node>).traverse(findAllRefs);
                if (idsForFunction.length != 0)
                    result.set(parentComponentLoc, idsForFunction);
                idsForFunction = [];
            }
        },
    });
    return result;
}
