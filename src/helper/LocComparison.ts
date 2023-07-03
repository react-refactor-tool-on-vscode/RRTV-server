import * as t from "@babel/types";

export function IsEqualLoc(
    loc1: t.SourceLocation,
    loc2: t.SourceLocation
): boolean {
    return (
        loc1.start.line == loc2.start.line &&
        loc1.start.column == loc2.start.column &&
        loc1.end.line == loc2.end.line &&
        loc1.end.column == loc2.end.column
    );
}
