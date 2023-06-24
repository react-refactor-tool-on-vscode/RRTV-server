import createHandler from "../interface/CreateHandler";
import { BaseHandler, ContinuousOutputHandler, ContinuousVoidHandler } from "../interface/Handler";

class HandlerA extends ContinuousOutputHandler<string, string> {
    protected concreteHandle(prevOutput: string, request: string): string {
        return prevOutput.toLowerCase();
    }
}

class HandlerB extends ContinuousOutputHandler<string, string> {
    protected concreteHandle(prevOutput: string, request: string): string {
        return prevOutput.concat(" end.");
    }
}

test("continuous output handler", () => {
    const handler = new HandlerA();
    handler.setNext(new HandlerB());
    expect(handler.handle("Abc", undefined)).toBe("abc end.");
})

test("createHandler test", () => {
    expect(createHandler([new HandlerA(), new HandlerB()], "Abc")(undefined)).toBe("abc end.");
})

class HandlerC extends ContinuousOutputHandler<number[], string> {
    protected concreteHandle(prevOutput: number[], request: string): number[] {
        prevOutput.push(request.search("a"));
        return prevOutput;
    }
}

class HandlerD extends ContinuousOutputHandler<number[], string> {
    protected concreteHandle(prevOutput: number[], request: string): number[] {
        prevOutput.push(request.search("b"));
        return prevOutput;
    }
}

test("createHandler test 2", () => {
    expect(createHandler([new HandlerC(), new HandlerD()], [])("cba")).toEqual([2, 1]);
})