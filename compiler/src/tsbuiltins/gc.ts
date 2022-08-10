import { LLVMGenerator } from "../generator";
import { FunctionMangler } from "../mangling";
import { Declaration } from "../ts/declaration";
import { LLVMConstantFP, LLVMValue } from "../llvm/value";
import { LLVMType } from "../llvm/type";

import { Runtime } from "../tsbuiltins/runtime"
import * as ts from "typescript";

const stdlib = require("std/constants");

export class GC {
    private readonly allocateFn: LLVMValue;
    private readonly allocateObjectFn: LLVMValue;
    private readonly deallocateFn: LLVMValue;

    private readonly addRootFn: LLVMValue;
    private readonly removeRootFn: LLVMValue;

    private readonly generator: LLVMGenerator;
    private readonly runtime: Runtime;
    private readonly gcType: LLVMType;

    constructor(generator: LLVMGenerator, runtime: Runtime) {
        this.generator = generator;
        this.runtime = runtime;

        const declaration = this.findGCDeclaration();
        this.allocateFn = this.findAllocateFunction(declaration, "allocate");
        this.allocateObjectFn = this.findAllocateFunction(declaration, "allocateObject");
        this.deallocateFn = this.findDeallocateFunction(declaration, "deallocate");

        this.addRootFn = this.findRootOpFunction(declaration, "addRoot");
        this.removeRootFn = this.findRootOpFunction(declaration, "removeRoot");

        this.gcType = this.generator.ts.checker.getTypeAtLocation(declaration.unwrapped).getLLVMType();
    }

    getGCType() : LLVMType {
        return this.gcType;
    }

    allocate(type: LLVMType, name?: string) {
        return this.doAllocate(this.allocateFn, type, name);
    }

    allocateObject(type: LLVMType, name?: string) {
        return this.doAllocate(this.allocateObjectFn, type, name);
    }

    deallocate(mem: LLVMValue) {
        const gcAddress = this.runtime.getGCAddress();
        const voidStarMem = this.generator.builder.asVoidStar(mem);

        return this.generator.builder.createSafeCall(this.deallocateFn, 
        [
            gcAddress,
            voidStarMem
        ]);
    }

    addRoot(mem: LLVMValue) {
        const gcAddress = this.runtime.getGCAddress();
        const voidStarMem = this.generator.builder.asVoidStar(mem);

        return this.generator.builder.createSafeCall(this.addRootFn, 
        [
            gcAddress,
            voidStarMem
        ]);
    }

    removeRoot(mem: LLVMValue) {
        const gcAddress = this.runtime.getGCAddress();
        const voidStarMem = this.generator.builder.asVoidStar(mem);

        return this.generator.builder.createSafeCall(this.removeRootFn, 
        [
            gcAddress,
            voidStarMem
        ]);
    }

    private doAllocate(callable: LLVMValue, type: LLVMType, name?: string) {
        if (type.isPointer()) {
            throw new Error(`Expected non-pointer type, got '${type.toString()}'`);
        }

        const gcAddress = this.runtime.getGCAddress();
        const size = type.getTypeSize();
        const returnValue = this.generator.builder.createSafeCall(callable, 
        [
            gcAddress,
            LLVMConstantFP.get(this.generator, size || 1),
        ]);

        return this.generator.builder.createBitCast(returnValue, type.getPointer(), name);
    }

    private findRootOpFunction(declaration: Declaration, name: string) {
        const rootOpDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === name);
        if (!rootOpDeclaration) {
            throw Error(`Unable to find ${name} function`);
        }

        const thisType = this.generator.ts.checker.getTypeAtLocation(declaration.unwrapped);
        const { qualifiedName } = FunctionMangler.mangle(
            rootOpDeclaration,
            undefined,
            thisType,
            [],
            this.generator,
            undefined,
            ["void*"]
        );

        const llvmReturnType = LLVMType.getVoidType(this.generator);
        const llvmArgumentTypes = [thisType.getLLVMType(), LLVMType.getInt8Type(this.generator).getPointer()];

        return this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName).fn;
    }

    private findAllocateFunction(declaration: Declaration, name: string) {
        const allocateDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === name);
        if (!allocateDeclaration) {
            throw Error(`Unable to find ${name} function`);
        }

        const thisType = this.generator.ts.checker.getTypeAtLocation(declaration.unwrapped);
        const { qualifiedName } = FunctionMangler.mangle(
            allocateDeclaration,
            undefined,
            thisType,
            [],
            this.generator,
            undefined,
            ["double"]
        );

        const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
        const llvmArgumentTypes = [thisType.getLLVMType(), LLVMType.getDoubleType(this.generator)];

        return this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName).fn;
    }

    private findDeallocateFunction(declaration: Declaration, name: string) {
        const deallocateDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === name);
        if (!deallocateDeclaration) {
            throw Error("Unable to find gc.deallocate function");
        }

        const thisType = this.generator.ts.checker.getTypeAtLocation(declaration.unwrapped);
        const { qualifiedName } = FunctionMangler.mangle(
            deallocateDeclaration,
            undefined,
            thisType,
            [],
            this.generator,
            undefined,
            ["void*"]
        );

        const voidType = LLVMType.getVoidType(this.generator);
        const voidStarType = LLVMType.getInt8Type(this.generator).getPointer();
        const llvmReturnType = voidType;
        const llvmArgumentTypes = [thisType.getLLVMType(), voidStarType];

        return this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName).fn;
    }

    private findGCDeclaration() : Declaration {
        const garbageCollector = this.generator.program.getSourceFiles().find((sourceFile) => sourceFile.fileName === stdlib.GC_DEFINITION);
        if (!garbageCollector) {
          throw new Error("No std Garbage collector file found");
        }
  
        let result: Declaration | null = null;

        garbageCollector.forEachChild((node) => {
          if (ts.isClassDeclaration(node)) {
              const clazz = Declaration.create(node as ts.ClassDeclaration, this.generator);
              const clazzName = clazz.type.getSymbol().escapedName;
              if (clazzName === "GC") {
                result = clazz;
              }
          }
        });
  
        if (!result) {
          throw new Error("Garbage collector declaration not found");
        }

        return result!;
    }
}