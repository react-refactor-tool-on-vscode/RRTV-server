import { Range } from "vscode-languageserver";
import parseToAst from "./ParseToAst";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { IsRangeInLoc } from "./RangeLoc";
import { locToRange } from "./locToRange";


export function getFuncPatternParam (code: string, range: Range): [string, Range]{
    let result = '';
    let paramRange:Range = Range.create(0,0,0,0);
    const ast = parseToAst(code);
    traverse(ast, {
        enter(path) {
            if (t.isFunctionDeclaration(path.node) &&
                IsRangeInLoc(range, path.node.loc)) {
                const param = path.node.params[0];
                paramRange = locToRange(param.loc);
                paramRange.start.character += 1;
                paramRange.end.character -= 1;
                if (t.isPattern(param)) {
                    result = code.substring(param.start + 1, param.end - 1);
                }
            }
        },
    });
    return [result, paramRange];
}
