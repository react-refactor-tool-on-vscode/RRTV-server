import { parse } from "@babel/parser";

function parseToAst(text: string) {
    return parse(text, {
        sourceType: "module",
        errorRecovery: true,
        plugins: ["jsx"],
    });
}

export default parseToAst;