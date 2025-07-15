import * as ts from "typescript";
import { TSType } from "../ts/type";
import { Declaration } from "../ts/declaration";

type Expression = ts.NewExpression | ts.CallExpression | ts.PropertyAccessExpression | undefined;

export class ArgumentsPatternComputer {

    private readonly declaration: Declaration;
    private readonly argumentTypes: TSType[];
    private readonly expression: Expression;

    constructor(declaration: Declaration, argumentTypes: TSType[], expression: Expression) {
        this.declaration = declaration;
        this.argumentTypes = argumentTypes;
        this.expression = expression;
    }

    private computeRestArgumentsType(restArgsStart: number, expression: ts.NewExpression | ts.CallExpression) : string {
    if (restArgsStart === -1 || this.argumentTypes.length === 0) {
        throw new Error("computeRestArgumentsType should be called on function with rest parameters");
    }

    if (!expression.arguments) {
        throw new Error("expression with rest arguments should have arguments");
    }

    if (expression.arguments.length !== this.argumentTypes.length) {
        throw new Error("expression arguments count should be equal to argument types count");
    }

    const declarationParameter = this.declaration.parameters[restArgsStart];
    if (declarationParameter.type) {
        const parameterText = declarationParameter.type.getText();
        if (parameterText === "any[]") {
            return "Array<Object*>*";
        }
    }

    for (let i = restArgsStart ; i < this.argumentTypes.length ; ++i) {
        const type = this.argumentTypes[i];
        const arg = expression.arguments[i];
        if (!ts.isSpreadElement(arg)) {
            continue;
        }

        if (type.isArray()) {
            return type.toCppType();
        }

        // Tuple with spread has all equal template arguments
        // Otherwise it will not be passed by the verifier
        if (type.isTuple()) {
            const elementType = type.getTypeGenericArguments()[0].toCppType();
            return "Array<" + elementType + ">*";
        }
        // Set, Map and other collections do not have ... support
    }

    // If there are no spread arguments then construct resulting type
    const elementType = this.argumentTypes[restArgsStart].toCppType();
    return "Array<" + elementType + ">*";
}

    compute(knownArgumentType: string[] | undefined): string[] {
        if (knownArgumentType) {
            return knownArgumentType;
        }

        if (!this.expression || ts.isPropertyAccessExpression(this.expression)) {
            return this.argumentTypes.map((type) => {
                return type.toCppType();
            });
        }

        let result: string[] = [];
        const restParametersStart = this.declaration.parameters.findIndex((p, _) => p.dotDotDotToken !== undefined);
        for (let i = 0 ; i < this.argumentTypes.length ; ++i) {
            if (i === restParametersStart) {
                result.push(this.computeRestArgumentsType(restParametersStart, this.expression))
                return result;
            }

            result.push(this.argumentTypes[i].toCppType());
        }

        // If there are rest params and rest param is missing
        if (this.argumentTypes.length < this.declaration.parameters.length && restParametersStart !== -1) {
            result.push("Array<Object*>*");
        }

        return result;
    }
}