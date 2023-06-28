import { Range } from "vscode-languageserver";
import parseToAst from "./ParseToAst";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { IsRangeInLoc } from "./RangeLoc";

export function checkParamIsSingleIdentifier(code: string, range: Range): boolean {
    let result = false;
    const ast = parseToAst(code);
    traverse(ast, {
        enter(path) {
            if (t.isFunctionDeclaration(path.node) &&
                IsRangeInLoc(range, path.node.loc)) {
                const param = path.node.params[0];
                if (t.isIdentifier(param) && path.node.params.length == 1) {
                    result = true;
                }
            }
        },
    });
    return result;
}
