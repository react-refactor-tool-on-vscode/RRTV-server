import { CodeAction, Command } from "vscode-languageserver-types";
import { BaseHandler, ContinuousOutputHandler } from "../interface/Handler";
import { CodeActionParams } from "vscode-languageserver-protocol";
import { connection, documents } from "../server";
import { findAllParentComponentReferences } from "../helper/findAllParentComponentReferences";
import { isCodeActionEnabled } from "../helper/isCodeActionEnabled";
import { ExecuteCommandParams, TextEdit } from "vscode-languageserver";
import { getTextEditsForStateLifting } from "../helper/getTextEditsForStateLifting";
import parseToAst from "../helper/ParseToAst";
import { checkParamIsSingleIdentifier } from "../helper/checkParamIsSingleIdentifier";

const commandName = "rrtv.stateLifting";

class StateLiftingCodeActionHandler extends ContinuousOutputHandler<
    (CodeAction | Command)[],
    CodeActionParams
> {
    protected concreteHandle(
        prevOutput: (CodeAction | Command)[],
        request: CodeActionParams
    ): (CodeAction | Command)[] {
        const code = documents.get(request.textDocument.uri).getText();
        if (isCodeActionEnabled(code, request.range)) {
            return [
                ...prevOutput,
                CodeAction.create(
                    "State Lifting",
                    Command.create(
                        "State Lifting",
                        commandName,
                        request.textDocument.uri,
                        request.range,
                        findAllParentComponentReferences(code, request.range),
                        checkParamIsSingleIdentifier(code, request.range)
                    )
                ),
            ];
        } else return [];
    }
}

// stateLiftingTypeEnum: 0 -> existed; 1 -> new

class StateLiftingExecuteCommandHandler extends BaseHandler<
    void,
    ExecuteCommandParams
> {
    handle(prevOutput: void, request: ExecuteCommandParams): void {
        if (request.command == commandName) {
            const [uri, range, refs, isParamSingleId, type, newId] =
                request.arguments;
            const edits = getTextEditsForStateLifting(
                parseToAst(documents.get(uri).getText()),
                range,
                isParamSingleId as boolean,
                (type as string) == "1",
                refs,
                newId
            );
            // Apply the edits.
        } else this.nextHandler.handle(null, request);
    }
}

export { StateLiftingCodeActionHandler };
