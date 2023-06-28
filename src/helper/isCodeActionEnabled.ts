import { Range } from "vscode-languageserver";
import parseToAst from "./ParseToAst";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { IsRangeInLoc } from "./RangeLoc";

export function isCodeActionEnabled(code: string, range: Range): boolean {
    const ast = parseToAst(code);
    let result = false;
    traverse(ast, {
        CallExpression(path) {
            if (t.isIdentifier(path.node.callee) &&
                IsRangeInLoc(range, path.node.loc)) {
                if (path.node.callee.name.startsWith("use")) {
                    result = true;
                }
            }
        },
    });
    return result;
}
