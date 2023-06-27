module.exports = (file, api, options) => {
    const j = api.jscodeshift;
    const root = j(file.source);
    let count = 0
    root.find(j.ArrowFunctionExpression)
        .forEach((path) => { handler(j, path, count++) })
    root.find(j.FunctionExpression)
        .forEach((path) => { handler(j, path, count++) })
    return root.toSource();
}

function handler(j, path, count) {
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