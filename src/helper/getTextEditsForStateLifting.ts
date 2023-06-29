import { Range, TextEdit } from "vscode-languageserver";
import * as t from "@babel/types";
import { getInternalTextEdit } from "./getInternalTextEdit";
import { getExternalTextEdit } from "./getExternalTextEdit";

export function getTextEditsForStateLifting(
    ast: t.Node,
    range: Range,
    isParamSingleId: boolean,
    isIntoNewComponent: boolean,
    refs: Map<t.SourceLocation, t.SourceLocation[]>,
    newId?: string
): TextEdit[] {
    return [
        ...getInternalTextEdit(isParamSingleId, ast, range),
        ...getExternalTextEdit(isIntoNewComponent, refs, ast, range, newId),
    ];
}
