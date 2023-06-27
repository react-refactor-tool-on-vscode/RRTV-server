import * as t from "@babel/types";
import { Range, TextEdit } from "vscode-languageserver";
import { generateObjectPattern } from "./generateObjectPattern";
import generate from "@babel/generator";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as _ from "lodash";

export function idsToTextEdit(
    document: TextDocument,
    paramRange: Range,
    ids: Array<string[]>,
    refRanges: Range[]
): TextEdit[] {
    let patternParam: t.Node;
    const paramCode = generate(generateObjectPattern(ids)).code;
    const delRanges = refRanges.map((refRange) => {
        let refText: string = document.getText(refRange);
        const index = _.findLastIndex(refText, (c) => c == ".");
        if (index != -1) {
            return TextEdit.del(
                Range.create(
                    refRange.start.line,
                    refRange.start.character,
                    refRange.end.line,
                    refRange.start.character + index + 1
                )
            );
        }
    });
    return [TextEdit.replace(paramRange, paramCode), ...delRanges];
}
