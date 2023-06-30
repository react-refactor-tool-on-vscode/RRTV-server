import { Range } from "vscode-languageserver";
import parseToAst from "./ParseToAst";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { IsRangeInLoc } from "./RangeLoc";
import { locToRange } from "./locToRange";
import generator from "@babel/generator";

export type HookResult = {
    result:string, 
    paramRange:Range, 
    funcRange:Range
}



export function getFuncPatternParam (code: string, range: Range): HookResult[]{
    let result = '';
    let paramRange:Range = Range.create(0,0,0,0);
    let funcRange:Range = Range.create(0, 0, 0, 0);
    const ast = parseToAst(code);
    const results:HookResult[] = [];
    traverse(ast, {
        enter(path) {
            if (t.isFunctionDeclaration(path.node) &&
                IsRangeInLoc(range, path.node.loc)) {
                    const param = path.node.params[0];
                    paramRange = locToRange(param.loc);
                    if (t.isPattern(param) || t.isIdentifier(param)) {
                        result = code.substring(param.start, param.end);
                        funcRange = locToRange(path.node.loc);
                        results.push({
                            result:result,
                            paramRange:paramRange,
                            funcRange:funcRange
                        })
                    }
            }
        },
    });
    return results;
}

export function replaceIdentifier(code:string, name:string, newName:string):string {
    const ast = parseToAst(code);
    traverse(ast, {
        enter(path) {
            if(t.isFunctionDeclaration(path.node)) {
                path.scope.rename(name, newName);
            }
        }
    })
    return generator(ast).code;
}
