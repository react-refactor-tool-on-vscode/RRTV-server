"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var code = "const renderButton = (text, onClick) => {\n    return (\n        <>\n            <button onClick={() => {\n                console.log('Button clicked!');\n            }}>{text}</button>\n            <button onClick={function () {\n                console.log('Button clicked!')\n            }}></button>\n            <button onClick={newFunction}></button>\n            <button onClick={function (e) {\n                console.log('Button clicked!', e)\n            }}></button>\n            <button onClick={e => NewFunction(e)}></button>\n            <button onClick={function (e, ee) {\n                console.log('Button clicked!', ee, e)\n            }}></button>\n            <button onClick={(e) => {\n                console.log('Button clicked!', e);\n            }}>{text}</button>\n            <button onClick={function(e) {\n                return NewFunction00(e)\n            }}></button>\n        </>\n    );\n}";
var index = 120;
var jscodeshift = require("jscodeshift");
var transform = function (file, api, options) {
    var j = api.jscodeshift;
    var root = j(file.source);
    var count = 0;
    root.find(j.ArrowFunctionExpression)
        .filter(function (path) { return new handleType().arrowFunctionExpression(path) && handleIndex(index, path); })
        .forEach(function (path) { handler(j, path, count++); });
    root.find(j.FunctionExpression)
        .filter(function (path) { return new handleType().functinoExpression(path, j) && handleIndex(index, path); })
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
function handleIndex(index, path) {
    seePosition(path, index);
    if (path.node.start <= index && index <= path.node.end) {
        return true;
    }
    return false;
}
function seePosition(path) {
    var rest = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        rest[_i - 1] = arguments[_i];
    }
    console.log.apply(console, __spreadArray([path.node.start, path.node.end], rest, false));
}
var handleType = /** @class */ (function () {
    function handleType() {
    }
    handleType.prototype.arrowFunctionExpression = function (path) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        /// 不识别 <button onClick={e => NewFunction(e)}></button>
        var body = path.node.body;
        return (body.type === "JSXElement" ||
            body.type === "FunctionExpression" ||
            body.type === "ArrowFunctionExpression" ||
            body.type === "BlockStatement");
    };
    handleType.prototype.functinoExpression = function (path) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        /// 不识别 <button onClick={function(e) { return NewFunction(e)}}></button>
        var body = path.node.body;
        /// j 放在 rest[0]
        var check = false;
        if (rest.length) {
            console.log(rest[0](path).find(rest[0].ReturnStatement).length ? rest[0](path).find(rest[0].ReturnStatement).get(0).node.argument.type : null);
            check = rest[0](path).find(rest[0].ReturnStatement, {
                argument: {
                    type: "CallExpression"
                }
            }).length > 0;
            console.log(check);
        }
        return !check;
    };
    return handleType;
}());
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
