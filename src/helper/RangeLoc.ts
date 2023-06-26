import { Range } from "vscode-languageserver";
import * as t from "@babel/types";

function IsRangeInLoc(range: Range, loc: t.SourceLocation): boolean {
    return (
        loc.start.line <= range.start.line + 1 &&
        loc.start.column <= range.start.character &&
        loc.end.line >= range.end.line + 1 &&
        loc.end.column >= range.end.character
    );
}

export { IsRangeInLoc };
