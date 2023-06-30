import { TextDocument } from "vscode-languageserver-textdocument";
import { BaseHandler, ContinuousOutputHandler } from "../interface/Handler";
import { connection, documents } from "../server";
import {
    Diagnostic,
    TextDocumentChangeEvent,
} from "vscode-languageserver/node";

import { TraverseOptions } from "@babel/traverse";
import parseToAst from "../helper/ParseToAst";
import { findDrillingParams } from "../helper/findDrillingParams";

import { generateDiagnosticsFromNodePaths } from "../helper/generateDiagnosticsFromNodePaths";

const commandName = "rrtv.propsDrilling";

class PropsDrillingDiagnosticHandler extends ContinuousOutputHandler<
    Diagnostic[],
    TextDocumentChangeEvent<TextDocument>
> {
    concreteHandle(
        prevOutput: Diagnostic[],
        request: TextDocumentChangeEvent<TextDocument>
    ): Diagnostic[] {
        const document = request.document;
        const text = document.getText();
        const drillingParams = findDrillingParams(parseToAst(text));
        return [
            ...prevOutput,
            ...generateDiagnosticsFromNodePaths(drillingParams),
        ];
    }
}

export { PropsDrillingDiagnosticHandler };
