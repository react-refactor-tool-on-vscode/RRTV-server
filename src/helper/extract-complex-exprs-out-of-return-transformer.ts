/* 
// ============= Example ================
const text = `function MyComponent(props) {
  return (
    <div>
       <h1>Hello {props.name}!</h1>
       {(handleClick)=>renderButton('Click me', handleClick)}
       {()=><button>{renderButton('Click me')}</button>}
       {()=>giveButton()}
       {(renderButton)=><button>{renderButton('Click me')}</button>}
       {(renderButton, e)=><button>{renderButton('Click me')}</button>}
       {(renderButton, e, d)=>{return <button>{renderButton('Click me')}</button>}}
    </div>
  );
}`
const index = 164 */

import * as jscodeshift from 'jscodeshift';

const transform = (file: jscodeshift.FileInfo, api: jscodeshift.API, options: jscodeshift.Options) => {
    const j = api.jscodeshift;
    let root;
    try {
        root = j(file.source);
    } catch (error) {
        return {
            newText: undefined,
            newRange: undefined
        }
    }
    const _handleType = new handleType()

    root.find(j.ArrowFunctionExpression)
        .filter((path: any) => _handleType.arrowFunctionExpression(path) && handleIndex(options.index, path))
        .forEach((path: any) => {
            const jsxExpressions = j(path).closest(j.JSXExpressionContainer)
            if (!jsxExpressions.length) return
            const functionName = "${1:NewFunction}";
            const functionBody = path.node.body.body ? path.node.body.body : [];
            let functionReturn: any
            if (functionBody.length === 0) {
                functionReturn = j.returnStatement(path.node.body)
            }
            const newFunction = j.functionDeclaration(
                j.identifier(functionName),
                path.node.params,
                functionBody.length ? j.blockStatement(functionBody) : j.blockStatement([functionReturn])
            );
            const returns = root.find(j.ReturnStatement).filter((_path: any) => { if (_path.node.end > path.node.end) return _path }).at(0)
            returns.insertBefore(newFunction)

            const newFunctionCallwithparams = j.callExpression(j.identifier(functionName), path.node.params);
            const newArrowFunctionExpression = j.arrowFunctionExpression(path.node.params, newFunctionCallwithparams)
            if (path.node.params.length === 0)
                j(path).replaceWith(j.identifier(functionName)) //ok
            else j(path).replaceWith(newArrowFunctionExpression)

            const findFD = returns.closest(j.FunctionDeclaration)
            const findDefination = findFD.length ? findFD : returns.closest(j.VariableDeclaration);
            _handleType.args.push(findDefination)
        })

    if (_handleType.args[0]) {
        const newRange = _handleType.args[0].get(0).node.loc
        return {
            newText: j(_handleType.args[0].__paths[0]).toSource(),
            newRange
        }
    }
    else {
        return {
            newText: undefined,
            newRange: undefined
        }
    }
}

function handler(j: jscodeshift.JSCodeshift, path: any, ...rest: any[]) {
    const jsxAttributes = j(path).closest(j.JSXAttribute)
    if (!jsxAttributes.length) return
    const functionName = "${1:NewFunction}"
    const newFunction = j.functionDeclaration(
        j.identifier(functionName),
        path.node.params,
        j.blockStatement(path.node.body.body)
    );

    const returns = jsxAttributes.closest(j.ReturnStatement)
    returns.insertBefore(newFunction)

    const newFunctionCall = j.callExpression(j.identifier(functionName), path.node.params);
    const newArrowFunctionExpression = j.arrowFunctionExpression(path.node.params, newFunctionCall)
    if (path.node.params.length === 0)
        j(path).replaceWith(j.identifier(functionName)) //ok
    else
        j(path).replaceWith(newArrowFunctionExpression)

    const findFD = returns.closest(j.FunctionDeclaration)
    const findDefination = findFD.length ? findFD : returns.closest(j.VariableDeclaration);
    rest[0].push(findDefination)
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
    public args: any[] = []
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
            check = rest[0](path).find(rest[0].ReturnStatement, {
                argument: {
                    type: "CallExpression"
                }
            }).length > 0
        }
        return !check
    }
}
export const checkExpressExtract = (text: string, index: number) => {
    const output = transform(
        {
            source: text,
            path: ""
        },
        {
            jscodeshift,
            j: jscodeshift,
            stats: () => { return;},
            report(msg) {
                return msg;
            },
        },
        {
            index
        }
    )
    return output;
}

/* const output = checkAttributeExtract(text, index)
console.log(output) */

/* if (output.newText === undefined) {
    console.error("条件不满足")
}
else {
    console.log("条件满足")
    /// use output.newText & output.newRange
    const newRange = {
        start: {
            line: output.newRange.start.line,
            character: output.newRange.start.column
        },
        end: {
            line: output.newRange.end.line,
            character: output.newRange.end.column
        }
    }
} */
