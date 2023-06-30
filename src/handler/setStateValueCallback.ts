import {
    CodeAction,
    CodeActionParams,
    Command,
    ExecuteCommandParams,
    TextDocumentEdit,
    TextEdit,
} from "vscode-languageserver";
import { BaseHandler, ContinuousOutputHandler } from "../interface/Handler";
import { documents } from "../server";
import parseToAst from "../helper/ParseToAst";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import generate from "@babel/generator";
import { IsRangeInLoc } from "../helper/RangeLoc";
import { locToRange } from "../helper/locToRange";

export class SetStateValueCallbackCodeActionHandler extends ContinuousOutputHandler<
    (CodeAction | Command)[],
    CodeActionParams
> {
    protected concreteHandle(
        prevOutput: (CodeAction | Command)[],
        request: CodeActionParams
    ): (CodeAction | Command)[] {
        const code = documents.get(request.textDocument.uri).getText();
        const range = request.range;

        const ast = parseToAst(code);
        let codeAction: CodeAction;
        traverse(ast, {
            CallExpression(path) {
                if (
                    t.isIdentifier(path.node.callee) &&
                    (path.node.callee as t.Identifier).name.startsWith("set") &&
                    IsRangeInLoc(range, path.node.loc)
                ) {
                    if (path.node.arguments.length == 1) {
                        const argument = path.node.arguments[0];
                        const loc = argument.loc;

                        if (
                            t.isArrowFunctionExpression(argument) &&
                            argument.params.length == 0
                        ) {
                            // To value
                            codeAction = CodeAction.create(
                                "Change setState callback to value",
                                {
                                    documentChanges: [
                                        TextDocumentEdit.create(
                                            {
                                                uri: request.textDocument.uri,
                                                version: documents.get(
                                                    request.textDocument.uri
                                                ).version,
                                            },
                                            [
                                                TextEdit.replace(
                                                    locToRange(loc),
                                                    generate(argument.params[0])
                                                        .code
                                                ),
                                            ]
                                        ),
                                    ],
                                }
                            );
                        } else {
                            // To arrow function
                        }
                    }
                }
            },
        });

        return [...prevOutput, codeAction];
    }
}
