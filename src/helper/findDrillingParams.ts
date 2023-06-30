import * as t from "@babel/types";
import traverse, { NodePath } from "@babel/traverse";
import * as _ from "lodash";
import { IsEqualLoc } from "./LocComparison";

export function findDrillingParams(ast: t.Node): NodePath<t.Identifier>[] {
    const result: NodePath<t.Identifier>[] = [];
    traverse(ast, {
        enter(path) {
            if (t.isFunction(path.node)) {
                // Get all params
                const paramsAll: NodePath<t.Identifier>[] = [];
                const notParamIdentifierLoc: t.SourceLocation[] = [];
                (path.get("params") as NodePath<t.Node>[]).forEach((path) =>
                    path.traverse({
                        ObjectProperty(path) {
                            if (
                                !IsEqualLoc(
                                    path.node.key.loc,
                                    path.node.value.loc
                                )
                            ) {
                                notParamIdentifierLoc.push(path.node.key.loc);
                            }
                        },
                        AssignmentPattern(path) {
                            notParamIdentifierLoc.push(path.node.right.loc);
                        },
                        Identifier(path) {
                            if (
                                _.every(
                                    notParamIdentifierLoc,
                                    (loc) => !IsEqualLoc(loc, path.node.loc)
                                )
                            ) {
                                paramsAll.push(path);
                            }
                        },
                    })
                );
                // Check is param a drilling one and modify paramsAll.
                let isJSXElementComponent: boolean[] = [];
                let drillingParams: NodePath<t.Identifier>[] = [];
                path.traverse({
                    enter(path) {
                        if (t.isJSXElement(path.node)) {
                            isJSXElementComponent.push(
                                !(
                                    t.isIdentifier(
                                        path.node.openingElement.name
                                    ) &&
                                    (
                                        path.node.openingElement
                                            .name as t.Identifier
                                    ).name[0] ==
                                        (
                                            path.node.openingElement
                                                .name as t.Identifier
                                        ).name[0].toLowerCase()
                                )
                            );
                        }
                        if (t.isJSXExpressionContainer(path.node)) {
                            if (t.isIdentifier(path.node.expression)) {
                                const param = paramsAll.find(
                                    (value) =>
                                        value.node.name ==
                                        (
                                            (
                                                path.node as t.JSXExpressionContainer
                                            ).expression as t.Identifier
                                        ).name
                                );
                                if (
                                    param != undefined &&
                                    drillingParams.find(
                                        (value) =>
                                            value.node.name ==
                                            (
                                                (
                                                    path.node as t.JSXExpressionContainer
                                                ).expression as t.Identifier
                                            ).name
                                    ) == undefined
                                )
                                    drillingParams.push(param);
                            }
                        }
                    },
                    exit(path) {
                        if (t.isJSXElement(path.node)) {
                            isJSXElementComponent = _.initial(
                                isJSXElementComponent
                            );
                        }
                    },
                });
                result.push(...drillingParams);
                drillingParams = [];
            }
        },
    });
    return result;
}
