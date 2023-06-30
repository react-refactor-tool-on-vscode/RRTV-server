import * as j from 'jscodeshift'
import { locToRange } from './locToRange';
export function transformer(text, index) {
    let root;
     try {
       root =  j(text)
    } catch (error) {
        return {
            check: false
        }
    };

    /// 找到函数声明
    const fd = root.find(j.FunctionDeclaration)
    const vd = root.find(j.VariableDeclaration)
    const declaration = fd.length ? fd : vd

    /// 建构名字列表
    const fd_namelist = new Set<any>()
    const jsx_namelist = new Set<any>()
    //.... 添加名字到 set 中

    /// 分类所有 jsx 元素 
    const je = root.findJSXElements()
    const c_je = {}
    je.forEach((path: any) => {
        const name = path.node.openingElement.name.name
        if (!c_je[name]) {
            c_je[name] = []
            jsx_namelist.add(name)
        }
        c_je[name].push(path)
    })

    /// 分类所有 声明
    const c_d = {}
    declaration.forEach(path => {
        const name = path.node.id.name
        if (!c_d[name]) {
            c_d[name] = []
            fd_namelist.add(name)
        }
        c_d[name].push(path)
    })

    /// 遍历名字列表
    // 为了保存 chain: {, ,}
    const chainlist = new Set<any>()
    // 开始遍历
console.log(fd_namelist)
    fd_namelist.forEach((name1: string) => {
        console.log(c_d[name1])
        j(c_d[name1]).findJSXElements().paths()
            .map((e: any) => {
                return e.node.openingElement.name.name
            })
            .filter(name => {
                return name !== undefined
            })
            .forEach(name2 => {
                if (!(name2 in c_d))
                    return
                const jsxnames = j(c_d[name2]).findJSXElements().paths()
                    .map((e: any) => {
                        return e.node.openingElement.name.name
                    })
                    .filter(name => name !== undefined)
                    .forEach(name3 => {
                        if (!(name3 in c_d))
                            return
                        const newchain = name1 + '.' + name2 + '.' + name3
                        chainlist.add(newchain)
                    })
            })
    })
    console.log(chainlist, "list")
    if (chainlist.size !== 1)
        return { check: false }
    const [App, Parent, Child] = Array.from(chainlist)[0].split('.')

    /// 获得 "App" "Parent" "Child"
    const d_app = c_d[App]
    const d_parent = c_d[Parent]
    const d_child = c_d[Child]

    const j_app = c_je[App]
    const j_parent = c_je[Parent]
    const j_child = c_je[Child]
    /// 判断与构建 range
    let checkIndex = false
    const r_app = d_app.map(path => { if (handleIndex(index, path)) checkIndex = true; return locToRange(path.node.loc) })
    const r_parent = d_parent.map(path => { if (handleIndex(index, path)) checkIndex = true; return locToRange(path.node.loc) })
    const r_child = d_child.map(path => { if (handleIndex(index, path)) checkIndex = true; return locToRange(path.node.loc) })
    const range = [
        r_app,
        r_parent,
        r_child
    ]

    if (!checkIndex) 
        return { check: false }
    /// 更改 Parent declaration [replaceWith]
    const pattern = j(d_parent[0]).find(j.ObjectPattern).paths()[0]
    const new_property = j.property("init", j.identifier("children"), j.identifier("children"))
    new_property.shorthand = true
    const properties = pattern.node.properties
    properties.push(new_property)

    const return_jsx = j(d_parent[0]).find(j.JSXElement)
    const new_args = pattern.node.properties.filter((node: any) => node.value.name !== "children").map((node: any) => node.key)
    const new_return = j.callExpression(j.identifier("children"), new_args)
    return_jsx.replaceWith(new_return)

    /// 更改 App declaration -> return
    const parent_element = j(d_app).findJSXElements(Parent)

    // 生成 {text => ...
    const expression = j.arrowFunctionExpression(
        new_args,
        j.jsxElement(
            j.jsxOpeningElement(
                j.jsxIdentifier(Child),
                new_args.map(arg => j.jsxAttribute(j.jsxIdentifier(arg.name), j.jsxExpressionContainer(arg))),
                true
            ),
            null,
            []
        )
    );
    console.log(expression)

    const op_element = parent_element.paths()
        .map(path => path.node.openingElement)
    const new_closeElement = j.jsxClosingElement(j.jsxIdentifier(Parent))
    op_element.forEach(node => node.selfClosing = false)
    const new_jsxElement = op_element.map(e => j.jsxElement(e, new_closeElement, [j.jsxText("\n"), j.jsxExpressionContainer(expression), j.jsxText("\n")]))
    for (let i = 0; i < new_jsxElement.length; ++i) {
        parent_element.at(i).replaceWith(new_jsxElement[i])
    }

    return { check: true, newText: root.toSource(), newRange: range };
}

function handleIndex(index: number, path: any): boolean {
    // seePosition(path, index)
    if (path.node.start <= index && index <= path.node.end) {
        return true
    }
    return false
}
// const res: boolean | string = transformer(text)
// if (typeof res === "boolean" && !res) 没有调用到组合的情境
// else res.newText, 替换全文
// res.newRange.forEach(range=>...) 

const text = `function CardBoard() {
	return (<>
		<Card text="text1" id="3" />
		<Card text="text2" id="4" />
		<Card text="text3" id="5" />
	</>
	)
}

function Card({text, id}) {
	return <CardDrawer text={text} id={id}/>
}

function CardDrawer({text, id}) {
	return <div id={id}>{text}</div>
}`

const index = 3

console.log(transformer(text, index))