/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment, createEnvironment, HeapVariableDeclaration } from "../../scope";
import { LLVMFunction } from "../../llvm/function";
import { LLVMType } from "../../llvm/type";
import { LLVMConstant, LLVMValue } from "../../llvm/value";
import { ConciseBody } from "../../ts/concisebody";
import { Declaration } from "../../ts/declaration";
import { FunctionHandler } from "../expression/functionhandler";

export class FunctionDeclarationHandler extends AbstractNodeHandler {
    handle(node: ts.Node, parentScope: Scope, outerEnv?: Environment): boolean {
        if (ts.isFunctionDeclaration(node)) {
            const declaration = Declaration.create(node, this.generator);

            if (!declaration.body) {
                return true;
            }

            const name = declaration.name?.getText();
            if (!name) {
                throw new Error(`Anonymous function declarations are not supported. Error at: '${declaration.getText()}'`);
            }

            const signature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);
            const parameters = signature.getDeclaredParameters();

            const llvmArgumentTypes: LLVMType[] = [];
            if (!declaration.typeParameters) {
                const tsArgumentTypes = parameters.map((parameter) => this.generator.ts.checker.getTypeAtLocation(parameter));
                llvmArgumentTypes.push(
                    ...tsArgumentTypes.map((argType) => {
                        return argType.getLLVMType();
                    })
                );
            } else {
                llvmArgumentTypes.push(...new Array(parameters.length).fill(LLVMType.getInt8Type(this.generator).getPointer()));
            }

            const scope = declaration.getScope(undefined);

            // these dummy arguments will be substituted by actual arguments once called
            const dummyArguments = llvmArgumentTypes.map((t) => {
                let nullArg = LLVMConstant.createNullValue(t.unwrapPointer(), this.generator);

                const allocated = this.generator.gc.allocate(nullArg.type.unwrapPointer());
                this.generator.builder.createSafeStore(nullArg, allocated);
                nullArg = allocated;

                if (nullArg.type.isUnion()) {
                    nullArg = this.generator.ts.union.create();
                }

                return nullArg;
            });

            this.generator.symbolTable.currentScope.initializeVariablesAndFunctionDeclarations(declaration.body, this.generator);

            // @todo: 'this' is bindable by 'bind', 'call', 'apply' so it should be stored somewhere
            const environmentVariables = ConciseBody.create(declaration.body, this.generator).getEnvironmentVariables(
                signature,
                scope,
                outerEnv
            );

            const env = createEnvironment(
                scope,
                environmentVariables,
                this.generator,
                {
                    args: dummyArguments,
                    signature,
                },
                outerEnv
            );

            let closure: LLVMValue;

            if (declaration.typeParameters) {
                this.generator.meta.registerFunctionEnvironment(declaration, env);
                closure = this.generator.tsclosure.lazyClosure.create(env.typed);
            } else {
                const tsReturnType = signature.getReturnType();
                const llvmReturnType = tsReturnType.getLLVMReturnType();

                const functionName = declaration.name
                    ? declaration.name.getText() + "__" + this.generator.randomString
                    : this.generator.randomString;
                const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], functionName);

                FunctionHandler.handleFunctionBody(declaration, fn, this.generator, env);
                LLVMFunction.verify(fn, declaration);

                closure = this.generator.tsclosure.createClosure(fn, env.untyped, declaration);
            }

            let existing = parentScope.get(name);

            if (existing && existing instanceof LLVMValue) {
                // overwrite pointers that possibly captured in some environments
                existing.makeAssignment(closure);
                // overwrite value for future uses
                parentScope.overwrite(name, new HeapVariableDeclaration(closure, closure, name));
            } else {
                parentScope.set(name, new HeapVariableDeclaration(closure, closure, name));
            }

            return true;
        }

        if (this.next) {
            return this.next.handle(node, parentScope, outerEnv);
        }

        return false;
    }
}
