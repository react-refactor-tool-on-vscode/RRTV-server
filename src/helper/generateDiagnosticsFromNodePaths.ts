import { Diagnostic } from "vscode-languageserver/node";
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { locToRange } from "./locToRange";

export function generateDiagnosticsFromNodePaths(paths: NodePath<t.Identifier>[]) {
    return paths.map((path) => Diagnostic.create(
        locToRange(path.node.loc),
        "Might be a drilling props"
    )
    );
}
