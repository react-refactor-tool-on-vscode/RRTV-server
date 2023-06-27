import { Range } from "vscode-languageserver";
import { SourceLocation } from "@babel/types";

export function locToRange(loc: SourceLocation): Range {
    return Range.create(
        loc.start.line - 1,
        loc.start.column,
        loc.end.line - 1,
        loc.end.column
    );
}
