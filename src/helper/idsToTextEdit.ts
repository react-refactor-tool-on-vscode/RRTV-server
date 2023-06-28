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
    refRanges: Range[],
    isDirectParam: boolean
): TextEdit[] {
    const patternParam: t.Node = generateObjectPattern(ids);
    const node: t.Node = isDirectParam
        ? patternParam
        : t.objectProperty(
              t.identifier(document.getText(paramRange)),
              patternParam
          );
    const paramCode = generate(node).code;
    const delRanges = refRanges.map((refRange) => {
        const refText: string = document.getText(refRange);
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
