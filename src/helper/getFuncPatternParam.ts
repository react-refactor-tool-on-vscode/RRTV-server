import { Range } from "vscode-languageserver";
import parseToAst from "./ParseToAst";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { IsRangeInLoc } from "./RangeLoc";


export function getFuncPatternParam (code: string, range: Range): string{
    let result = '';
    const ast = parseToAst(code);
    traverse(ast, {
        enter(path) {
            if (t.isFunctionDeclaration(path.node) &&
                IsRangeInLoc(range, path.node.loc)) {
                const param = path.node.params[0];
                if (t.isPattern(param)) {
                    result = code.substring(param.start + 1, param.end - 1);
                }
            }
        },
    });
    return result;
}
