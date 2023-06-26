import { parse } from "@babel/parser";
import * as t from "@babel/types";
import traverse, { NodePath } from "@babel/traverse";

const text = `function TodoItem({item: {source, text}}) {
    return (
        <>
        <img src={source} />
        <span>{text}</span>
        </>
    )
}`;

const ast = parse(text, {
    sourceType: "module",
    errorRecovery: true,
    plugins: ["jsx"],
});

it("find all jsx identifier", () => {
    const jsxIdentifiers: any[] = [];

    traverse(ast, {
        JSXIdentifier(path) {
            jsxIdentifiers.push(path.node.name);
        },
    });

    expect(jsxIdentifiers).toMatchSnapshot();
});

it("find all identifier", () => {
    const identifiers: any[] = [];

    traverse(ast, {
        Identifier(path) {
            identifiers.push(path.node.name);
        },
    });

    expect(identifiers).toMatchSnapshot();
});

it("get params type", () => {
    let result: string;

    traverse(ast, {
        enter(path) {
            if (t.isFunction(path.node)) {
                result = typeof(path.get('params'));
            }
        },
    });

    expect(result).toMatchSnapshot();
});

it("can get first param", () => {
    let result: boolean;

    traverse(ast, {
        enter(path) {
            if (t.isFunction(path.node)) {
                result = typeof(path.get('params.0')) != null;

                const params = path.node.params;
                const first_param = path.get('params.0');
                const a = "asd";
            }
        }
    })

    expect(result).toMatchSnapshot();
})