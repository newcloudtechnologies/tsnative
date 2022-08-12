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
            return this.handleFunctionDeclaration(declaration, parentScope, outerEnv);
        }

        if (this.next) {
            return this.next.handle(node, parentScope, outerEnv);
        }

        return false;
    }

    handleFunctionDeclaration(declaration: Declaration, parentScope: Scope, outerEnv?: Environment) {
        if (declaration.isAmbient()) {
            // ambient declarations are used to map calls to cxx backend, nothing to handle
            return true;
        }

        const env = this.createEnvironmentForDeclaration(declaration, outerEnv);
        const closure = this.createClosureForDeclaration(declaration, env, parentScope);

        this.registerClosureForDeclaration(closure, declaration, parentScope);

        return true;
    }

    private getDeclarationName(declaration: Declaration) {
        const name = declaration.name?.getText();
        if (!name) {
            throw new Error(`Anonymous function declarations are not supported. Error at: '${declaration.getText()}'`);
        }

        return name;
    }

    createEnvironmentForDeclaration(declaration: Declaration, outerEnv?: Environment) {
        if (!declaration.body) {
            throw new Error(`Expected body at function declaration '${declaration.getText()}'`);
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

        // these dummy arguments will be substituted by actual arguments once called
        const dummyArguments = llvmArgumentTypes.map((type) => {
            if (type.isUnion()) {
                return this.generator.ts.union.create();
            }

            const nonPtrType = type.unwrapPointer();

            const nullValue = LLVMConstant.createNullValue(nonPtrType, this.generator);
            const allocated = this.generator.gc.allocate(nonPtrType);
            this.generator.builder.createSafeStore(nullValue, allocated);

            return allocated;
        });

        this.generator.symbolTable.currentScope.initializeVariablesAndFunctionDeclarations(declaration.body, this.generator);

        const scope = this.generator.symbolTable.currentScope;

        const environmentVariables = ConciseBody.create(declaration.body, this.generator).getEnvironmentVariables(
            signature,
            scope,
            outerEnv
        );

        return createEnvironment(
            scope,
            environmentVariables,
            this.generator,
            {
                args: dummyArguments,
                signature,
            },
            outerEnv
        );
    }

    createClosureForDeclaration(declaration: Declaration, env: Environment, scope: Scope) {
        if (declaration.typeParameters) {
            this.generator.meta.registerFunctionEnvironment(declaration, env);
            return this.generator.tsclosure.lazyClosure.create(env.typed);
        }

        const signature = this.generator.ts.checker.getSignatureFromDeclaration(declaration);
        const tsReturnType = signature.getReturnType();
        const llvmReturnType = tsReturnType.getLLVMReturnType();

        const functionName = this.getDeclarationName(declaration) + "__" + this.generator.randomString;
        const { fn } = this.generator.llvm.function.create(llvmReturnType, [env.voidStar], functionName);

        FunctionHandler.handleFunctionBody(declaration, fn, this.generator, env);
        LLVMFunction.verify(fn, declaration);

        return this.generator.tsclosure.createClosure(fn, env, declaration, scope);
    }

    registerClosureForDeclaration(closure: LLVMValue, declaration: Declaration, parentScope: Scope) {
        const name = this.getDeclarationName(declaration);
        const existing = parentScope.get(name);

        if (existing && existing instanceof LLVMValue) {
            // overwrite pointers that possibly captured in some environments
            existing.makeAssignment(closure);
            // overwrite value for future uses
            parentScope.overwrite(name, new HeapVariableDeclaration(closure, closure, name));
        } else {
            parentScope.set(name, new HeapVariableDeclaration(closure, closure, name));
        }
    }
}
