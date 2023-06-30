import { locToRange } from './locToRange';
const j = require("jscodeshift")

const isSameSet = (s1: Set<any>, s2: Set<any>) => {
    /* 获取一个集合所有的值，判断另外一个集合是否全部包含该这些值 */
    const isSame = (a: Set<any>, b: Set<any>) => {
        const values = Array.from(a)
        for (let val of values) {
            if (!b.has(val)) return false
        }
        return true
    }
    /* a 包含 b，b 包含 a，那么两个集合相同 */
    return isSame(s1, s2) && isSame(s2, s1)
}

function checkJSXElement(jsxElements, j, root) {
    let total: any[] = []
    const childCountSet = new Set()
    let count = 0
    let childcount = 0
    let check = true
    /// 2 如果 div 少于两个，那没必要判断是否相似
    const name = jsxElements.get(0).node.openingElement.name.name
    if (jsxElements.length < 2) {
        console.log("exit at hasSameElements", name)
        //return root.toSource()
        return { check: false }
    }
    /// 前端交互需要，记录 range 和 elementIndex
    const range = {}
    let elementIndex = 0
    jsxElements.forEach((path: any) => {
        total.push(new Set<any>())
        range[name + '.' + elementIndex] = path.node.loc // 后续 split('.')
        elementIndex++
        const set = total[count]
        const jsxChildren = j(path).childElements()
        /// 4 如果没有儿子，也一定不相似
        if (!jsxChildren.length) {
            console.log("exit at hasChildren", jsxElements.get(0).node.openingElement.name.name)
            return { check: false }
            //return root.toSource()
        }
        childCountSet.add(jsxChildren.length)
        /// 3 如果子节点有不同数量，那不相似
        if (childCountSet.size > 1) {
            console.log("exit at childCountSet")
            return { check: false }
            //return root.toSource()
        }
        jsxChildren.forEach((path) => {
            set.add(path.node.openingElement.name.name)
            const jsxAttributes = j(path.node.openingElement.attributes)
            jsxAttributes.forEach((path) => {
                const name = path.node.name.name
                set.add(name)
            })
            childcount++
        })
        count++
    })
    for (let i = 0; i < total.length - 2; ++i) {
        if (isSameSet(total[i], total[i + 1]))
            return { check: false }
    }
    console.log(check, "check", jsxElements.get(0).node.openingElement.name.name) //true
    return { check, range }
}

function constructJSXElement(attrName, attrValue, ...rest) {
    const j = rest[0];
    const attributes: any[] = [];
    for (let i = 0; i < attrName.length; i++) {
        const propertyName = j.jsxIdentifier(attrName[i]);
        const propertyValue = j.literal(attrValue[i]);
        const attribute = j.jsxAttribute(propertyName, propertyValue); //j.jsxExpressionContainer(propertyValue)
        attributes.push(attribute);
    }

    const openingElement = j.jsxOpeningElement(j.jsxIdentifier("NewFunction"), attributes, true);
    const jsxElement = j.jsxElement(openingElement, null, []);

    return jsxElement;
}

function check(j, root) {
    const classify = {}
    const allname = new Set()
    let lenOfName = 0
    const all = root.findJSXElements()
    all.forEach((path) => {
        const nodeName = path.node.openingElement.name.name
        allname.add(nodeName)
        if (lenOfName !== allname.size) {
            if (classify[nodeName]) {
                classify[nodeName].push(path)
            }
            else {
                classify[nodeName] = []
                classify[nodeName].push(path)
            }
            lenOfName = allname.size
        }
        else {
            classify[nodeName].push(path)
        }
    })
    /// 添加诊断
    let res = {}
    let range = {}
    for (let key in classify) {
        const checkResult = checkJSXElement(j(classify[key]), j, root)
        if (checkResult.check) {
            res["diag"] = true
            res[key] = classify[key]
            for (let key in checkResult.range) 
                range[key] = locToRange(checkResult.range[key])
        }
    }
    return { result: res, range: range }
}

const modifier = (j, divElements, elementIndex) => {
    //const divElements = root.findJSXElements("div");
    /// after filter by index   // const elementIndex = filterIndex()
    const divElementPath = divElements.paths()[elementIndex];
    /// set attributes
    const children = j(divElementPath).childElements();
    /// 准备记录 name & value
    const attrname: string[] = [];
    const attrvalue: string[] = [];
    children.forEach((path) => {
        const jsxAttributes = j(path.node.openingElement.attributes);
        jsxAttributes.forEach((path) => {
            /// 记录 name & value
            const name: string = path.node.name.name;
            const value: string = path.node.value.value;
            attrname.push(name);
            attrvalue.push(value);
            /// 改变 value
            path.node.value = j.jsxExpressionContainer(j.identifier(name));
        });
    });
    const findFunctionDeclaration = j(divElementPath).closest(j.FunctionDeclaration);
    const declaration = findFunctionDeclaration.length
        ? findFunctionDeclaration
        : j(divElementPath).closest(j.VariableDeclaration);
    console.log(declaration);
    /// 新函数, 用 <></>包裹 jsxElement
    const jsxFragment = j.jsxFragment(j.jsxOpeningFragment(), j.jsxClosingFragment(), [divElementPath.node]);
    /// 函数参数生成
    const newParams: any[] = [];
    attrname.forEach((name) => {
        newParams.push(j.property("init", j.identifier(name), j.identifier(name)));
    });
    const newFunctionDeclaration = j.functionDeclaration(
        j.identifier("newFunction"),
        [j.objectPattern(newParams)],
        j.blockStatement([j.returnStatement(jsxFragment)])
    );
    declaration.at(0).insertBefore(newFunctionDeclaration);
    /// 替换原来位置
    const alternativeElement = constructJSXElement(attrname, attrvalue, j);
    console.log(divElements.at(elementIndex))
    divElements.at(elementIndex).replaceWith(alternativeElement);

    /// 更改其他相似组件
    const restDivElements = divElements.filter((path) => path !== divElementPath);
    restDivElements.forEach((path) => {
        /// set attributes
        const children = j(path).childElements();
        /// 准备记录 name & value
        const attrName: string[] = [];
        const attrValue: string[] = [];
        children.forEach((path: any) => {
            const jsxAttributes = j(path.node.openingElement.attributes);
            jsxAttributes.forEach((path: any) => {
                /// 记录 name & value
                const name = path.node.name.name;
                const value = path.node.value.value;
                attrName.push(name);
                attrValue.push(value);
            });
        });
        /// 替换原来位置
        const restAlternativeElement = constructJSXElement(attrname, attrvalue, j);
        j(path).replaceWith(restAlternativeElement);
    });
}

/* function interactor(j, root) {
    const res = check(j, root)
    let diag = false
    if (res === {})
        return { diag }
    else
        return { diag, res }
    return res
} */

export function transformer(root, elements, elementIndex) {
    modifier(j, elements, elementIndex)
    return root.toSource();
}

const text = `const TestSim = () => {
  return <>
	<hello>
		<button id="1" me="2"></button>
		<button you="3" type="4"></button>
	</hello>
	<div>
		<button id="1" me="2"></button>
		<button you="3" type="4"></button>
	</div>
	<p></p>
</> 
}
const TestSim2 = () => {
  return <>
	<code></code>
	<div>
		<button id="1" me="2"></button>
		<button you="3" type="4"></button>
	</div>
	<hello>
		<button id="1" me="2"></button>
		<button you="3" type="4"></button>
	</hello>
</> 
}`

const api = {
    jscodeshift: j
}

/// 诊断全文，进行一定的缓存
export const checkIfDiag = (text: string) => {
    const file = { source: text }
    const root = j(file.source)
    const result = check(j, root)
    const diag = result.result["diag"]
    if (!diag) {
        console.log("组件相似条件不满足")
        return { diag: false }
    }
    return { diag: true, cache: {...result, root} }
}

/// elements: cache.result[name]
/// elementIndex: key in cache.range, then split by '.', take [1]
/// root: cache.root

/*  步骤
... 首先诊断
const res = checkIfDiag(text)
if (!res.diag) 无组件相似
// 有组件相似
const range: any[] = []
for (let key in res.cache.range) {
    range.push(res.cache.range[key])
}
... 然后分发 range 去诊断

用户触发 codeAction 之后，从 res.cache.range 获得必要的数据用来 transform
假设 codeAction 能返回 传过去 的range
for (let key in res.cache.range) {
    if (res.cache.range[key] === 传回来的range) {
        const tmp = key.split(".")
        const elements = cache.result[tmp[0]]
        const elementIndex = tmp[1]

        const newText = transformer(res.cache.root, elements, elementIndex)
        ... 全文替换
    }
}

*/

const res = checkIfDiag(text)
console.log(res)