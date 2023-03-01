/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { LLVMGenerator } from "../generator";
import { Declaration } from "./declaration";
import { FunctionMangler } from "../mangling";
import { LLVMType } from "../llvm/type";
import { LLVMValue } from "../llvm/value";
import { Environment } from "../scope/scope";

import * as ts from "typescript";

const stdlib = require("std/constants");

export class TSLazyClosure {
    static readonly type_name = "__lazy_closure";

    private readonly generator: LLVMGenerator;
    private readonly llvmType: LLVMType;
    private readonly declaration: Declaration;
  
    private ctorFn: LLVMValue;
    private getEnvFn: LLVMValue;

    constructor(generator: LLVMGenerator) {
        this.generator = generator;
        this.declaration = this.initClassDeclaration();
        this.llvmType = this.declaration.getLLVMStructType(TSLazyClosure.type_name);

        this.getEnvFn = this.initGetEnvironmentFn();
        this.ctorFn = this.initCtorFn();
    }

    getLLVMType() : LLVMType {
        return this.llvmType;
    }

    private initClassDeclaration() : Declaration {
        const stddefs = this.generator.program
          .getSourceFiles()
          .find((sourceFile) => sourceFile.fileName === stdlib.LAZY_CLOSURE_DEFINITION);
    
        if (!stddefs) {

            console.log(`++ ${stdlib.LAZY_CLOSURE_DEFINITION}`);

            this.generator.program.getSourceFiles()
                .forEach(file => console.log(`- ${file.fileName}`));

            throw new Error("No lazy closure definition source file found");
        }
    
        const classDeclaration = stddefs.statements.find((node) => {
          return ts.isClassDeclaration(node) && node.name?.getText(stddefs) === "TSLazyClosure";
        });
    
        if (!classDeclaration) {
          throw new Error("Unable to find 'TSLazyClosure' declaration in std library definitions");
        }
    
        return Declaration.create(classDeclaration as ts.ClassDeclaration, this.generator);
    }

    private initGetEnvironmentFn() : LLVMValue {
        const thisType = this.declaration.type;
    
        const getEnvironmentDeclaration = this.declaration.members.find(
          (m) => m.isMethod() && m.name?.getText() === "getEnvironment"
        );
    
        if (!getEnvironmentDeclaration) {
          throw new Error("No function declaration for TSLazyClosure.getEnvironment provided");
        }
    
        const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
          getEnvironmentDeclaration,
          undefined,
          thisType,
          [],
          this.generator
        );
        if (!isExternalSymbol) {
          throw new Error("External symbol for TSClosure.getEnvironment not found");
        }
    
        const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer().getPointer().getPointer();
        const llvmArgumentTypes = [this.llvmType];
    
        const { fn: getEnvironment } = this.generator.llvm.function.create(
          llvmReturnType,
          llvmArgumentTypes,
          qualifiedName
        );
    
        return getEnvironment;
    }

    private initCtorFn() : LLVMValue {
        const thisType = this.declaration.type;
    
        const constructorDeclaration = this.declaration.members.find((m) => m.isConstructor());
        if (!constructorDeclaration) {
          throw new Error(`Unable to find constructor declaration at '${this.declaration.getText()}'`);
        }
    
        const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
          constructorDeclaration,
          undefined,
          thisType,
          [],
          this.generator,
          undefined,
          ["void***"]
        );
        if (!isExternalSymbol) {
          throw new Error("External symbol TSLazyClosure constructor not found");
        }
    
        const llvmReturnType = LLVMType.getVoidType(this.generator);
        const llvmArgumentTypes = [
          this.llvmType,
          LLVMType.getInt8Type(this.generator).getPointer().getPointer().getPointer(),
        ];
        const { fn: constructor } = this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName);
    
        return constructor;
    }

    create(env: Environment) : LLVMValue {
        if (env.untyped.type.getPointerLevel() !== 1) {
          throw new Error("Malformed environment");
        }
    
        const thisValue = this.generator.gc.allocateObject(this.llvmType.unwrapPointer());
        const untypedEnv = this.generator.builder.asVoidStarStarStar(env.untyped);
    
        const constructor = this.ctorFn!;
        this.generator.builder.createSafeCall(constructor, [
          thisValue,
          untypedEnv,
        ]);
        return thisValue;
    }

    retrieveEnviroment(lazyClosure: LLVMValue) : LLVMValue {
        const lazyClosureEnv = this.generator.builder.createSafeCall(this.getEnvFn, [lazyClosure]);
        return this.generator.builder.asVoidStar(lazyClosureEnv);
    }
}