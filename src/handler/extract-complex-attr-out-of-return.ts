const code = `const renderButton = (text, onClick) => {
    return (
        <>
            <button onClick={() => {
                console.log('Button clicked!');
            }}>{text}</button>
            <button onClick={function () {
                console.log('Button clicked!')
            }}></button>
            <button onClick={newFunction}></button>
            <button onClick={function (e) {
                console.log('Button clicked!', e)
            }}></button>
            <button onClick={e => NewFunction(e)}></button>
            <button onClick={function (e, ee) {
                console.log('Button clicked!', ee, e)
            }}></button>
            <button onClick={(e) => {
                console.log('Button clicked!', e);
            }}>{text}</button>
            <button onClick={function(e) {
                return NewFunction00(e)
            }}></button>
        </>
    );
}`
const index = 120

import * as jscodeshift from 'jscodeshift';

const transform = (file: jscodeshift.FileInfo, api: jscodeshift.API, options: jscodeshift.Options) => {
    const j = api.jscodeshift;
    const root = j(file.source);
    let count = 0
    root.find(j.ArrowFunctionExpression)
        .filter(path => new handleType().arrowFunctionExpression(path) && handleIndex(index, path))
        .forEach((path) => { handler(j, path, count++) })
    root.find(j.FunctionExpression)
        .filter(path => new handleType().functinoExpression(path, j) && handleIndex(index, path))
        .forEach((path) => { handler(j, path, count++) })
    return root.toSource();
}

function handler(j: jscodeshift.JSCodeshift, path: any, count: number) {
    const jsxAttributes = j(path).closest(j.JSXAttribute)
    if (!jsxAttributes.length) return
    const functionName = "NewFunction" + count
    const newFunction = j.functionDeclaration(
        j.identifier("NewFunction" + count),
        path.node.params,
        j.blockStatement(path.node.body.body)
    );
    jsxAttributes.closest(j.ReturnStatement)
        .insertBefore(newFunction)
    const newFunctionCall = j.callExpression(j.identifier(functionName), path.node.params);
    const newArrowFunctionExpression = j.arrowFunctionExpression(path.node.params, newFunctionCall)
    if (path.node.params.length === 0)
        j(path).replaceWith(j.identifier(functionName)) //ok
    else
        j(path).replaceWith(newArrowFunctionExpression)

}

function handleIndex(index: number, path: any): boolean {
    // seePosition(path, index)
    if (path.node.start <= index && index <= path.node.end) {
        return true
    }
    return false
}

function seePosition(path: any, ...rest: any[]) {
    console.log(path.node.start, path.node.end, ...rest)
}

class handleType {
    constructor() { }
    arrowFunctionExpression(path: any, ...rest: any[]) {
        /// 不识别 <button onClick={e => NewFunction(e)}></button>
        const body = path.node.body;
        return (
            body.type === "JSXElement" ||
            body.type === "FunctionExpression" ||
            body.type === "ArrowFunctionExpression" ||
            body.type === "BlockStatement"
        );
    }
    functinoExpression(path: any, ...rest: any[]) {
        /// 不识别 <button onClick={function(e) { return NewFunction(e)}}></button>
        const body = path.node.body;
        /// j 放在 rest[0]
        let check = false
        if (rest.length) {
            // console.log(rest[0](path).find(rest[0].ReturnStatement).length ? rest[0](path).find(rest[0].ReturnStatement).get(0).node.argument.type : null) /// true
            check = rest[0](path).find(rest[0].ReturnStatement, {
                argument: {
                    type: "CallExpression"
                }
            }).length > 0
            console.log(check)
        }
        return !check
    }
}

const output = transform(
    {
        source: code,
        path: ""
    },
    {
        jscodeshift,
        j: jscodeshift,
        stats: () => { },
        report(msg) {

        },
    },
    {}
)

console.log(output)

