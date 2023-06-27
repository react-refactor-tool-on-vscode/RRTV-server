import { parse } from "@babel/parser";

function parseToAst(text: string) {
    try {
        return parse(text, {
            sourceType: "module",
            errorRecovery: true,
            plugins: ["jsx"],
        });
    } catch (error) {
        return parse("");
    }
}

export default parseToAst;
