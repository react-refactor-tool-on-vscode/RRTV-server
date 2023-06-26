const parser = require('@babel/parser');
const traverse = require('@babel/traverse')
const t = require('@babel/types')
const generate = require('@babel/generator').default


/**
 * generate ast from code
 */
module.exports.textToAst = function textToAst(text) {
    return parser.parse(text, {
        sourceType: 'script', // module unambigious
        plugins: ['jsx', 'typescript'],
    });
}

/**
 * store Element infor
 * interface ElementSpecified {
 *     node;
 *     path;
 * }
 */
let JSXElementSpecified = {
    node: undefined,
    path: undefined
}

/**
 * store range data
 */
let range = {
    start: 0,
    end: 999999
}

let SiblingsSpecified = new Set()

/**
 * base on range and blank JSXElementSpecified, generate new JSXElementSpecified
 * @param {Range} range the range of selection
 * @param {ElementSpecified} JSXElementSpecified 
 * @returns new JSXElementSpecified
 */
function RangeToJSXElementGenerator(range, JSXElementSpecified, ast) {
    traverse.default(ast, RangeToJSXElementVisitor(range, JSXElementSpecified))
    if (JSXElementSpecified.node === undefined) {
        // throw new Error("所选区域内无完整 XML 元素!")
        return { valid: false}
    }
    // return JSXElementSpecified
    return {valid: true, specified: JSXElementSpecified}

}
function RangeToJSXExpresionContainer(range, JSXExpressionContainerSpecified) {
    traverse.default(ast, RangeToJSXExprssionContainerVisitor(range, JSXExpressionContainerSpecified))
    if (JSXExpressionContainerSpecified.node === undefined) {
        throw new Error("所选区域内无完整元素!")
    }
    return JSXExpressionContainerSpecified

}
function RangeToJSXExpressionContainer(node, opts) {
    if (!(opts.range.start <= node.start && node.end <= opts.range.end))
        return false
    if (opts.node === undefined)
        return true
    if (opts.node.start <= node.start && node.end <= opts.node.end)
        return false

    return true
}

/**
 * generate specific visitor
 * @param {range} the range of selection
 * @param {JSXElementSpecified} JSXElementSpecified
 * @returns visitor used to traverse for JSXElement
 */
function RangeToJSXElementVisitor(range, JSXElementSpecified) {
    return {
        JSXElement(path) {
            if (RangeToJSXElementEdgeHandler(path.node, { range, node: JSXElementSpecified.node })) {
                if (JSXElementSpecified.node !== undefined)
                    if (path.node.end <= JSXElementSpecified.node.start || path.node.start >= JSXElementSpecified.node.end) {
                        SiblingsSpecified.add(JSXElementSpecified)
                    } // no siblings, it blank
                JSXElementSpecified.node = path.node
                JSXElementSpecified.path = path
            }
        }

    }
}
/**
 * judge whether to handle this trip when visiting
 * @param {node} node 
 * @param {opts} other data: range, node
 * @returns whether to handle
 */
function RangeToJSXElementEdgeHandler(node, opts) {
    if (!(opts.range.start <= node.start && node.end <= opts.range.end))
        return false
    if (opts.node === undefined)
        return true
    if (opts.node.start <= node.start && node.end <= opts.node.end)
        return false

    return true
}


/**
 * base on current path, generate specification of parent path adjacent to Program
 * @param {path} path current path
 * @returns specification of parent path adjacent to Program
 */
function PathToParentPathUnilProgram(path) {
    /// TODO: 更好的检测方式，用 isProgram 并不稳定：考虑返回值的 parentPath
    const parentpath = path.findParent((_path) => t.isProgram(_path.parentPath.node))
    const parentnode = parentpath.node
    return {
        node: parentnode,
        path: parentpath
    }
}

/**
 * base on the JSXElement in current range, generate specification of parent path adjacent to Program
 * @returns specification of parent path adjacent to Program
 */
function JSXElementToOuterFunctionDeclarationGenerator() {
    const path = RangeToJSXElementGenerator(range, JSXElementSpecified).path
    return PathToParentPathUnilProgram(path)
}

/**
 * give base and Name, new params, transform jsx to function wrapping it
 * @param {*} JSXElementNode based JSXElement
 * @param {*} Name Name of New Function
 * @param {*} NewParams Params of New Function
 * @returns new FunctionDeclaration based on JSXElement
 */
function JSXElementToNewFunctionDeclarationTransformer(JSXElementNode, Name, NewParams) {
    // 创建新的函数体
    const newFunctionBody = t.blockStatement([t.returnStatement(JSXElementNode)]);

    // 创建新的FunctionDeclaration节点
    const newFunctionDeclaration = t.functionDeclaration(
        t.identifier(Name),
        NewParams,
        newFunctionBody
    );

    return newFunctionDeclaration
}

/**
 * give base, transform JSXElement to its references
 * @param {*} JSXElementPath base JSXElement
 * @returns all of its references, like {'a', 'b'}
 */
function JSXElementToReferencesTransformer(JSXElementPath) {
    const references = new Set();

    JSXElementPath.traverse({
        JSXExpressionContainer(path) {
            const parentPath = path.parentPath;
            if (
                (parentPath.isJSXAttribute()) &&
                parentPath.node.name.name !== 'key' &&
                parentPath.node.name.name !== 'ref'
            ) {
                const { name } = path.node.expression;
                references.add(name);
            }
            else if (parentPath.isJSXElement()) {
                references.add(...getChildNames(path))
            }
        },
    });
    return references;
}

function getChildNames(path) {
    //   const names = new Set();
    const names = []
    path.traverse({
        Identifier(childPath) {
            const name = childPath.node.name;
            names.push(name)
        }
    }, path.scope);
    //   return Array.from(names);
    return names
}

/**
 * give base, tranform refs to params of a function
 * @param {*} references base refs
 * @returns new params of a function
 */
function ReferencesToFunctionParamsTransformer(references) {
    let properties = []
    for (let item of references) {
        const key = t.identifier(item);
        const value = t.identifier(item);
        properties = [...properties, t.objectProperty(key, value, false, true)];
    }
    const objectPattern = t.objectPattern(properties);
    const params = [objectPattern];
    return params;
}

/**
 * give base, attention to refs, transform JSXElement to its Alternative
 * @param {*} JSXElementNode base
 * @param {*} references base
 * @returns its Alterative which serves origin as child
 */
function JSXElementToAlternativeTransformer(JSXElementNode, references) {
    // 生成新的 JSXOpeningElement 节点
    let newJSXAttributes = []
    references.forEach(
        (item) => {
            newJSXAttributes = [
                ...newJSXAttributes,
                t.jsxAttribute(
                    t.jsxIdentifier(item),
                    t.jsxExpressionContainer(t.identifier(item))
                )
            ]
        }
    )
    const newJSXOpeningElement = t.jsxOpeningElement(
        t.jsxIdentifier('NewFunction'),
        newJSXAttributes
    );
    newJSXOpeningElement.selfClosing = true; // 设置闭合标签属性为 true

    // 生成新的 JSXElement 节点
    const newJSXElement = t.jsxElement(
        newJSXOpeningElement,
        null,
        []
    );

    return newJSXElement
}

/**
 * modify the ast based on all Elements, which generated from generator or transformed from original Element
 */
module.exports.dataGenerator = function isValid(ast) {
    return RangeToJSXElementGenerator(range, JSXElementSpecified, ast)
}
module.exports.modifier = function modifier(ast, JSXElementSpecified) {
    // 并联其他有效兄弟节点 
    /// TODO: 放入一个函数中
    const children = JSXElementSpecified.path.parentPath.get('children')
    let siblings = []
    // if (typeof children !== "object")
    try {
        children.forEach(childPath => {
            if ((childPath.isJSXElement() || childPath.isJSXExpressionContainer()) && childPath !== JSXElementSpecified.path && range.start <= childPath.node.start && childPath.node.end <= range.end) {
                siblings.push(childPath);
            }
        });
    } catch (e) {
        console.log("children is not iterable")
    }
    siblings.push(JSXElementSpecified.path)
    let fragment = undefined
    if (siblings.length > 1) {
        fragment = wrapJSXElements(siblings)
        siblings.forEach(childPath => {
            if (childPath !== JSXElementSpecified.path)
                childPath.remove()
        })
    }

    const BasedFunctionDeclarationPath = JSXElementToOuterFunctionDeclarationGenerator().path
    if (fragment) {
        const FragmentElement = JSXElementSpecified.path.replaceWith(fragment)
        console.log(FragmentElement)
        JSXElementSpecified.path = FragmentElement[0]
        JSXElementSpecified.node = FragmentElement[0].node
    }

    const references = JSXElementToReferencesTransformer(JSXElementSpecified.path)
    const newParams = ReferencesToFunctionParamsTransformer(references)
    const newFunctionDeclaration = JSXElementToNewFunctionDeclarationTransformer(JSXElementSpecified.node, "NewFunction", newParams)

    // 插入新的FunctionDeclaration节点作为与指定BasedFunctionDeclaration节点同级的下一个节点
    BasedFunctionDeclarationPath.insertAfter(newFunctionDeclaration);

    const JSXElementAlternative = JSXElementToAlternativeTransformer(JSXElementSpecified.node, references)
    // 替换旧的JSXElement节点
    JSXElementSpecified.path.replaceWith(JSXElementAlternative);
    /**
 * base on ast, generate {code, map}
 */
const newText = generate(ast, {
    comments: true,
    retainLines: false,
    compact: false,
    concise: false,
    // sourceMaps: true,
}).code;
const _range = BasedFunctionDeclarationPath.node.loc
return {newText, _range}
}

function wrapJSXElements(paths) {
    const jsxElements = paths.map(path => path.node);
    const fragment = t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), jsxElements);
    return fragment
}


// console.log(generateCode)

