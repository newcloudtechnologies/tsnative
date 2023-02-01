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

import { LLVMGenerator } from "../generator";
import { FunctionMangler } from "../mangling";
import { Declaration } from "../ts/declaration";
import {LLVMConstant, LLVMConstantFP, LLVMConstantInt, LLVMValue} from "../llvm/value";
import { LLVMType } from "../llvm/type";

import { Runtime } from "../tsbuiltins/runtime"

import * as ts from "typescript";

const stdlib = require("std/constants");

export class GC {
    private readonly allocateFn: LLVMValue;
    private readonly allocateObjectFn: LLVMValue;
    private readonly generator: LLVMGenerator;
    private readonly runtime: Runtime;
    private readonly gcType: LLVMType;
    private readonly addRootFn: LLVMValue;
    private readonly removeRootFn: LLVMValue;

    constructor(generator: LLVMGenerator, runtime: Runtime) {
        this.generator = generator;
        this.runtime = runtime;

        const declaration = this.findGCDeclaration();

        this.allocateFn = this.findAllocateFunction(declaration, "allocate");
        this.allocateObjectFn = this.findAllocateFunction(declaration, "allocateObject");

        this.addRootFn = this.findAddRootFunction(declaration, "addRoot");
        this.removeRootFn = this.findRemoveRootFunction(declaration, "removeRoot");

        this.gcType = this.generator.ts.checker.getTypeAtLocation(declaration.unwrapped).getLLVMType();
    }

    getGCType(): LLVMType {
        return this.gcType;
    }

    allocate(type: LLVMType, name?: string): LLVMValue {
        return this.doAllocate(this.allocateFn, type, name);
    }

    allocateObject(type: LLVMType, name?: string) : LLVMValue {
        return this.doAllocate(this.allocateObjectFn, type, name);
    }

    addRoot(value: LLVMValue, associatedName?: string): LLVMValue {
        if (value.type.getPointerLevel() !== 2) {
            return value; // This is not a root, just do nothing
        }

        const i8PtrPtrType = LLVMType.getInt8Type(this.generator).getPointer().getPointer();
        const i8PtrPtrRoot = this.generator.builder.createBitCast(value, i8PtrPtrType);
        const gcAddress = this.runtime.getGCAddress(); // TODO Should that be a global constant?

        const i8PtrType = LLVMType.getInt8Type(this.generator).getPointer();
        let i8PtrAssociatedName = LLVMConstant.createNullValue(i8PtrType, this.generator);
        if (this.generator.useGCVariableNames) {
            const strObj = this.generator.ts.str.create(associatedName !== undefined ? associatedName : "");
            i8PtrAssociatedName = this.generator.builder.createBitCast(strObj, i8PtrType);
        }
        return this.generator.builder.createSafeCall(this.addRootFn, [gcAddress, i8PtrPtrRoot, i8PtrAssociatedName]);
    }

    removeRoot(value: LLVMValue): LLVMValue {
        if (value.type.getPointerLevel() !== 2) {
            return value; // This is not a root, just do nothing
        }

        const i8PtrPtrType = LLVMType.getInt8Type(this.generator).getPointer().getPointer();
        const i8PtrPtr = this.generator.builder.createBitCast(value, i8PtrPtrType);
        const gcAddress = this.runtime.getGCAddress();

        return this.generator.builder.createSafeCall(this.removeRootFn, [gcAddress, i8PtrPtr]);
    }

    private doAllocate(callable: LLVMValue, type: LLVMType, name?: string) : LLVMValue {
        const gcAddress = this.runtime.getGCAddress();
        const size = this.getAllocationSize(type);
        const returnValue = this.generator.builder.createSafeCall(callable,
            [
                gcAddress,
                LLVMConstantFP.get(this.generator, size),
            ]);

        return this.generator.builder.createBitCast(returnValue, type.getPointer(), name);
    }

    private getAllocationSize(type: LLVMType) {
        if (type.isPointer()) {
            return type.getTypeSize();
        }
        
        // Ensure that the allocated memory will at least fit for Object (>=sizeof(Object)).
        // E.g., when hoisting comes to play, Object constructor may be called on memory allocated for lazy_closure (1 byte-sized struct)
        // and this MAY lead to heap corruption.
        return Math.max(type.getTypeSize(), this.generator.ts.obj.getLLVMType().unwrapPointer().getTypeSize());
    }

    private findAddRootFunction(declaration: Declaration, name: string) {
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
            ["void**, void*"]
        );

        const llvmReturnType = LLVMType.getVoidType(this.generator);
        const llvmArgumentTypes = [thisType.getLLVMType(), LLVMType.getInt8Type(this.generator).getPointer().getPointer(),
            LLVMType.getInt8Type(this.generator).getPointer()];

        return this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName).fn;
    }

    private findRemoveRootFunction(declaration: Declaration, name: string) {
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
            ["void**"]
        );

        const llvmReturnType = LLVMType.getVoidType(this.generator);
        const llvmArgumentTypes = [thisType.getLLVMType(), LLVMType.getInt8Type(this.generator).getPointer().getPointer()];

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

    private findGCDeclaration(): Declaration {
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