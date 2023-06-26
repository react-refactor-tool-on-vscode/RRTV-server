  import * as node from "vscode-languageserver/node";
  import * as t from "@babel/types"

export interface Specified {
        node: t.Node;
        path: any
}
  declare function dataGenerator(ast: t.Node): {
    valid: boolean, 
    specified: Specified
  };
  
  export interface ModifierResult {
    newText: string;
    _range: node.Range;
  }
  
  declare function modifier(ast: t.Node, JSXElementSpecified: Specified): ModifierResult;
  
  declare function textToAst(text: string): t.Node;