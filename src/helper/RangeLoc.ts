import { Range } from "vscode-languageserver";
import * as t from "@babel/types";

function IsRangeInLoc(range: Range, loc: t.SourceLocation): boolean {
    return (
        loc.start.line <= range.start.line &&
        loc.start.column <= range.start.character &&
        loc.end.line >= range.end.line &&
        loc.end.column >= range.end.character
    );
}

export { IsRangeInLoc };
