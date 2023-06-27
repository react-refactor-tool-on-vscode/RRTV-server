"use strict";
exports.__esModule = true;
var code = "const renderButton = (text, onClick) => {\n    return (\n        <>\n            <button onClick={() => {\n                console.log('Button clicked!');\n            }}>{text}</button>\n            <button onClick={function () {\n                console.log('Button clicked!')\n            }}></button>\n            <button onClick={newFunction}></button>\n            <button onClick={function (e) {\n                console.log('Button clicked!', e)\n            }}></button>\n            {/*<button onClick={e => NewFunction(e)}></button>*/}\n            <button onClick={function (e, ee) {\n                console.log('Button clicked!', ee, e)\n            }}></button>\n            <button onClick={(e) => {\n                console.log('Button clicked!', e);\n            }}>{text}</button>\n        </>\n    );\n}";
var jscodeshift = require("jscodeshift");
var transform = function (file, api, options) {
    var j = api.jscodeshift;
    var root = j(file.source);
    var count = 0;
    root.find(j.ArrowFunctionExpression)
        .forEach(function (path) { handler(j, path, count++); });
    root.find(j.FunctionExpression)
        .forEach(function (path) { handler(j, path, count++); });
    return root.toSource();
};
function handler(j, path, count) {
    var jsxAttributes = j(path).closest(j.JSXAttribute);
    if (!jsxAttributes.length)
        return;
    var functionName = "NewFunction" + count;
    var newFunction = j.functionDeclaration(j.identifier("NewFunction" + count), path.node.params, j.blockStatement(path.node.body.body));
    jsxAttributes.closest(j.ReturnStatement)
        .insertBefore(newFunction);
    var newFunctionCall = j.callExpression(j.identifier(functionName), path.node.params);
    var newArrowFunctionExpression = j.arrowFunctionExpression(path.node.params, newFunctionCall);
    if (path.node.params.length === 0)
        j(path).replaceWith(j.identifier(functionName)); //ok
    else
        j(path).replaceWith(newArrowFunctionExpression);
}
var output = transform({
    source: code,
    path: ""
}, {
    jscodeshift: jscodeshift,
    j: jscodeshift,
    stats: function () { },
    report: function (msg) {
    }
}, {});
console.log(output);
