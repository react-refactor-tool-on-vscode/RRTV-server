import { Range } from "vscode-languageserver";
import { isCodeActionEnabled } from "../helper/isCodeActionEnabled";
import { findAllParentComponentReferences } from "../helper/findAllParentComponentReferences";
import { checkParamIsSingleIdentifier } from "../helper/checkParamIsSingleIdentifier";
import parseToAst from "../helper/ParseToAst";
import { getInternalTextEdit } from "../helper/getInternalTextEdit";
import { getExternalTextEdit } from "../helper/getExternalTextEdit";
import { SourceLocation } from "@babel/types";
import { getTextEditsForStateLifting } from "../helper/getTextEditsForStateLifting";

test("check is code action enabled", () => {
    const usage1 = {
        code: `function Test({item}) {const [count, setCount] = useState(0);
            return <div onClick={() => setCount(count + 1)}>{item.text}</div>
        }`,
        range: Range.create(0, 52, 0, 54),
    };

    const result = isCodeActionEnabled(usage1.code, usage1.range);

    expect(result).toBe(true);

    const usage2 = {
        code: usage1.code,
        range: Range.create(0, 39, 0, 41),
    };

    const result2 = isCodeActionEnabled(usage2.code, usage2.range);

    expect(result2).toBe(false);
});

test("test find all parent component references", () => {
    const usage1 = {
        code: `function App(props) {const item = { text: "Hello?" }
            return <Test item={item} />
        }
        function Test({ item }) {
            const [count, setCount] = useState(0);
            return <div onClick={() => setCount(count + 1)}>{item.text}</div>
        }`,
        range: Range.create(4, 43, 4, 44),
    };

    const result = findAllParentComponentReferences(usage1.code, usage1.range);

    expect(result.size).toBe(1);

    console.log(123);
});

test("test check function param is single identifier", () => {
    const usage1 = {
        code: `function Test({item}) {const [count, setCount] = useState(0);
            return <div onClick={() => setCount(count + 1)}>{item.text}</div>
        }`,
        range: Range.create(0, 52, 0, 54),
    };

    const result1 = checkParamIsSingleIdentifier(usage1.code, usage1.range);

    expect(result1).toBe(false);

    const usage2 = {
        code: `function Test(item) {const [count, setCount] = useState(0);
            return <div onClick={() => setCount(count + 1)}>{item.text}</div>
        }`,
        range: Range.create(0, 52, 0, 54),
    };

    const result2 = checkParamIsSingleIdentifier(usage2.code, usage2.range);

    expect(result2).toBe(true);

    const usage3 = {
        code: `function Test(item,text) {const [count, setCount] = useState(0);
            return <div onClick={() => setCount(count + 1)}>{item.text}</div>
        }`,
        range: Range.create(0, 57, 0, 59),
    };
    const result3 = checkParamIsSingleIdentifier(usage3.code, usage3.range);

    expect(result3).toBe(false);
});

test("get internal test edit for single param", () => {
    const code1 = `function ComponentWithState(props) {
        const [state1, setState1] = useState(0);
    
        return (
            <div onclick={() => setState1(state1 + 1)}>
                <div>{props.text}</div>
                <span>{state1}</span>
            </div>)
    }`;

    const ast1 = parseToAst(code1);

    const result1 = getInternalTextEdit(true, ast1, Range.create(1, 40, 1, 42));
    expect(result1).toMatchSnapshot();
});

test("get internal test edit for single object pattern", () => {
    const code1 = `function ComponentWithState({item}) {
        const [state1, setState1] = useState(0);
    
        return (
            <div onclick={() => setState1(state1 + 1)}>
                <div>{item.text}</div>
                <span>{state1}</span>
            </div>)
    }`;

    const ast1 = parseToAst(code1);

    const result1 = getInternalTextEdit(
        false,
        ast1,
        Range.create(1, 40, 1, 42)
    );
    expect(result1).toMatchSnapshot();
});

test("get internal test edit for wrong param", () => {
    const code1 = `function ComponentWithState([a,b]) {const [count,setCount] = useState(0);return <div>{a}</div>};}`;
    const ast1 = parseToAst(code1);
    const result1 = getInternalTextEdit(true, ast1, Range.create(0, 67, 0, 67));
    expect(result1).toMatchSnapshot();
});

test("get external test edit without external refs", () => {
    const code1 = `function ComponentWithState({item}) {
        const [state1, setState1] = useState(0);
    
        return (
            <div onclick={() => setState1(state1 + 1)}>
                <div>{item.text}</div>
                <span>{state1}</span>
            </div>)
    }`;

    const ast1 = parseToAst(code1);

    const result1 = getExternalTextEdit(
        true,
        new Map<SourceLocation, SourceLocation[]>(),
        ast1,
        Range.create(1, 40, 1, 40),
        "StateContainer"
    );

    expect(result1).toMatchSnapshot();
});

test("get external test edit with external refs", () => {
    const code = `function ComponentWithState({item}) {
        const [state1, setState1] = useState(0);
    
        return (
            <div onclick={() => setState1(state1 + 1)}>
                <div>{item.text}</div>
                <span>{state1}</span>
            </div>)
    }
function App() {return <ComponentWithState item={{text="123"}} />}`;
    const ast = parseToAst(code);
    const range = Range.create(0, 41, 0, 41);

    const map = findAllParentComponentReferences(code, range);
    const result = getExternalTextEdit(
        true,
        new Map(Array.from(map)),
        ast,
        range,
        "StateContainer"
    );

    expect(result).toMatchSnapshot();
});

test("get external text edit with external refs to existed parent component", () => {
    const code = `function ComponentWithState({item}) {
        const [state1, setState1] = useState(0);
    
        return (
            <div onclick={() => setState1(state1 + 1)}>
                <div>{item.text}</div>
                <span>{state1}</span>
            </div>)
    }
function App() {return <ComponentWithState item={{text="123"}} />}`;
    const ast = parseToAst(code);
    const range = Range.create(0, 41, 0, 41);

    const map = findAllParentComponentReferences(code, range);
    const result = getExternalTextEdit(
        false,
        new Map(Array.from(map)),
        ast,
        range
    );

    expect(result).toMatchSnapshot();
});

test("get external text edit with external refs to existed parent component 2", () => {
    const code = `const { useState } = require("react")

    function Test(props) {
        const [count, setCount] = useState(0);
        return (
            <>
            <span>{props.text}</span>
            <img src={props.src} alt="Something" />
            <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
            </>
        )
    }
    
    function App(props) {
        return <Test text={"Some text"} src={"https://sample.com/s?q=aydg2"} />
    }
    
    export default App;`;
    const ast = parseToAst(code);
    const range = Range.create(3, 38, 3, 39);

    const map = findAllParentComponentReferences(code, range);
    const result = getExternalTextEdit(
        false,
        new Map(Array.from(map)),
        ast,
        range
    );

    expect(result).toMatchSnapshot();
});

test("get all text edits", () => {
    const code = `const { useState } = require("react")

    function Test(props) {
        const [count, setCount] = useState(0);
        return (
            <>
            <span>{props.text}</span>
            <img src={props.src} alt="Something" />
            <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
            </>
        )
    }
    
    function App(props) {
        return <Test text={"Some text"} src={"https://sample.com/s?q=aydg2"} />
    }
    
    export default App;`;
    const ast = parseToAst(code);
    const range = Range.create(3, 38, 3, 39);
    const result = getTextEditsForStateLifting(
        ast,
        range,
        true,
        false,
        findAllParentComponentReferences(code, range)
    );

    expect(result).toMatchSnapshot();
});

test("get all text edits auto", () => {
    const code = `const { useState } = require("react")

    function Test(props) {
        const [count, setCount] = useState(0);
        return (
            <>
            <span>{props.text}</span>
            <img src={props.src} alt="Something" />
            <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
            </>
        )
    }
    
    function App(props) {
        return <Test text={"Some text"} src={"https://sample.com/s?q=aydg2"} />
    }
    
    export default App;`;
    const ast = parseToAst(code);
    const range = Range.create(3, 38, 3, 39);

    const result = getTextEditsForStateLifting(
        ast,
        range,
        checkParamIsSingleIdentifier(code, range),
        false,
        findAllParentComponentReferences(code, range),
        undefined
    )
    expect(result).toMatchSnapshot();

    const refs = Array.from(findAllParentComponentReferences(code, range));
    expect(refs).toMatchSnapshot();
})

it("get internal edits for empty function", () => {
    const code1 = `function ComponentWithState() {
        const [state1, setState1] = useState(0);
    
        return (
            <div onclick={() => setState1(state1 + 1)}>
                <div>Hello</div>
            </div>)
    }`;

    const ast1 = parseToAst(code1);

    const result1 = getInternalTextEdit(false, ast1, Range.create(1, 42, 1, 42));
    expect(result1).toMatchSnapshot();
})

it("get external edits for those with closing jsx element", () => {
    const code = `const { useState } = require("react")

    function Test(props) {
        const [count, setCount] = useState(0);
        return (
            <>
            <span>{props.text}</span>
            <img src={props.src} alt="Something" />
            <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
            </>
        )
    }
    
    function App(props) {
        return <Test text={"Some text"} src={"https://sample.com/s?q=aydg2"}></Test>
    }
    
    export default App;`;
    const ast = parseToAst(code);
    const range = Range.create(3, 38, 3, 39);

    const map = findAllParentComponentReferences(code, range);
    const result = getExternalTextEdit(
        false,
        new Map(Array.from(map)),
        ast,
        range
    );

    expect(result).toMatchSnapshot();
})