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