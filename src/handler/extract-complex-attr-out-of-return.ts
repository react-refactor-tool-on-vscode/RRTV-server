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
        </>
    );
}`

import * as jscodeshift from 'jscodeshift';

const transform = (file: jscodeshift.FileInfo, api: jscodeshift.API, options: jscodeshift.Options) => {
    const j = api.jscodeshift;
    const root = j(file.source);
    let count = 0
    root.find(j.ArrowFunctionExpression)
        .filter(path => new handleType().arrowFunctionExpression(path) && handleIndex(34, path))
        .forEach((path) => { handler(j, path, count++) })
    root.find(j.FunctionExpression)
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
    console.log(path.node.start, path.node.end, index)
    return false
}

class handleType {
    constructor() { }
    arrowFunctionExpression(path: any) {
        const body = path.node.body;
        return (
            body.type === "JSXElement" ||
            body.type === "FunctionExpression" ||
            body.type === "ArrowFunctionExpression" ||
            body.type === "BlockStatement"
        );
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

