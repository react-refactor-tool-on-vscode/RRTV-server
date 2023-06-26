import { parse } from "@babel/parser";
import * as t from "@babel/types";
import traverse, { NodePath } from "@babel/traverse";
import generate from "@babel/generator";
import { canBeDestructed } from "../handler/PropFlatten";
import { Range } from "vscode-languageserver";

const text1 = `function TodoItem({item: {source, text}}) {
    return (
        <>
        <img src={source} />
        <span>{text}</span>
        </>
    )
}`;

const ast1 = parse(text1, {
    sourceType: "module",
    errorRecovery: true,
    plugins: ["jsx"],
});

const text2 = `function TodoItem(item) {
    return (
        <>
        <img src={item.source} />
        <span>{item.text}</span>
        </>
    )
}`;

const ast2 = parse(text2, {
    sourceType: "module",
    errorRecovery: true,
    plugins: ["jsx"],
});

it("find all jsx identifier", () => {
    const jsxIdentifiers: any[] = [];

    traverse(ast1, {
        JSXIdentifier(path) {
            jsxIdentifiers.push(path.node.name);
        },
    });

    expect(jsxIdentifiers).toMatchSnapshot();
});

it("find all identifier", () => {
    const identifiers: any[] = [];

    traverse(ast1, {
        Identifier(path) {
            identifiers.push(path.node.name);
        },
    });

    expect(identifiers).toMatchSnapshot();
});

it("get params type", () => {
    let result: string;

    traverse(ast1, {
        enter(path) {
            if (t.isFunction(path.node)) {
                result = typeof path.get("params");
            }
        },
    });

    expect(result).toMatchSnapshot();
});

it("can get first param", () => {
    let result: boolean;

    traverse(ast1, {
        enter(path) {
            if (t.isFunction(path.node)) {
                result = typeof path.get("params.0") != null;

                const params = path.node.params;
                const first_param = path.get("params.0");
                const a = "asd";
            }
        },
    });

    expect(result).toMatchSnapshot();
});

it("functionTypeParam test", () => {
    const ast = t.functionTypeParam(
        t.identifier("id"),
        t.stringTypeAnnotation()
    );

    const code = generate(ast).code;

    expect(code).toMatchSnapshot();
});

it("path between parent and array(container)", () => {
    let result: boolean = false;
    const code = "function Test ([a,b]) {return a;}";
    const ast = parse(code);
    traverse(ast, {
        Identifier(path) {
            if (result == false) result = t.isArrayPattern(path.parent);
        },
    });

    expect(result).toMatchSnapshot();
});

it("traverse function body", () => {
    const identifiersInBody: any[] = [];

    traverse(ast1, {
        FunctionDeclaration(path) {
            path.get("body").traverse({
                Identifier(path) {
                    identifiersInBody.push(path.node.name);
                },
            });
        },
    });

    expect(identifiersInBody).toMatchSnapshot();
});

test("check param can be destructed", () => {
    expect(canBeDestructed(Range.create(0, 19, 0, 19), ast2)).toEqual({
        beDestructed: true,
        identifierName: "item",
    });

    expect(canBeDestructed(Range.create(0, 0, 0, 0), ast2)).toEqual({
        beDestructed: false,
        identifierName: null,
    });

    expect(canBeDestructed(Range.create(0, 18, 0, 21), ast2)).toEqual({
        beDestructed: true,
        identifierName: "item",
    });
});
