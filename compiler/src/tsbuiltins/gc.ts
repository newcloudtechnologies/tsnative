import { LLVMGenerator } from "../generator";
import { FunctionMangler } from "../mangling";
import { Declaration } from "../ts/declaration";
import { LLVMConstantFP, LLVMValue } from "../llvm/value";
import { LLVMType } from "../llvm/type";

import { Runtime } from "../tsbuiltins/runtime"

export class GC {
    private readonly allocateFn: LLVMValue;
    private readonly allocateObjectFn: LLVMValue;
    private readonly deallocateFn: LLVMValue;
    private readonly generator: LLVMGenerator;
    private readonly runtime: Runtime;

    constructor(declaration: Declaration, generator: LLVMGenerator, runtime: Runtime) {
        this.generator = generator;
        this.runtime = runtime;
        this.allocateFn = this.findAllocateFunction(declaration, "allocate");
        this.allocateObjectFn = this.findAllocateFunction(declaration, "allocateObject");
        this.deallocateFn = this.findDeallocateFunction(declaration, "deallocate");
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
}