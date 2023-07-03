import { Position, Range } from "vscode-languageserver";
import { SourceLocation } from "@babel/types";

export function locToRange(loc: SourceLocation): Range {
    return Range.create(
        loc.start.line - 1,
        loc.start.column,
        loc.end.line - 1,
        loc.end.column
    );
}

export function locEndToPosition(loc: SourceLocation): Position {
    return Position.create(loc.end.line - 1, loc.end.column);
}

export function locStartAfterToPosition(loc: SourceLocation): Position {
    return Position.create(loc.start.line - 1, loc.start.column + 1);
}