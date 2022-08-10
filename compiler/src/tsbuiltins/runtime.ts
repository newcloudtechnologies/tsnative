import { LLVMGenerator } from "../generator";
import { FunctionMangler } from "../mangling";
import { LLVMValue, LLVMGlobalVariable, LLVMConstant } from "../llvm/value";
import { Declaration } from "../ts/declaration";
import { LLVMType } from "../llvm/type";
import { GC } from "../tsbuiltins/gc";

export class Runtime {
    private readonly generator: LLVMGenerator;

    private garbageCollector: GC;

    private getGCFn: LLVMValue;
    private globalGCAddress: LLVMValue | undefined;

    constructor(declaration: Declaration, generator: LLVMGenerator) {
      this.generator = generator;

      this.getGCFn = this.findGetGC(declaration);

      this.garbageCollector = new GC(this.generator, this);

      this.putGCIntoGlobalVariable();
    }

    get gc() : GC {
        return this.garbageCollector;
    }

    getGCAddress() : LLVMValue {
      if (!this.globalGCAddress) {
        throw new Error("Cannot get GC address because global gc variable has not been created yet");
      }
      return this.generator.builder.createLoad(this.globalGCAddress);
    }

    private putGCIntoGlobalVariable() {
      const nullValue = LLVMConstant.createNullValue(this.gc.getGCType(), this.generator);
      this.globalGCAddress = LLVMGlobalVariable.make(this.generator, this.gc.getGCType(), false, nullValue, "gc_constant");

      const gcAddress = this.callGetGC();
      this.generator.builder.createSafeStore(gcAddress, this.globalGCAddress);
      this.gc.addRoot(gcAddress);
    }

    private callGetGC() : LLVMValue {
      const addressVoidStar = this.generator.builder.createSafeCall(this.getGCFn, [], "global GC void*");
      return this.generator.builder.createBitCast(addressVoidStar, this.gc.getGCType(), "global GC");
    }

    private findGetGC(declaration: Declaration) {
      const getGCDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "getGC");
      if (!getGCDeclaration) {
        throw Error("Unable to find getGC function");
      }

      const thisType = this.generator.ts.checker.getTypeAtLocation(declaration.unwrapped);
  
      const { qualifiedName } = FunctionMangler.mangle(
        getGCDeclaration,
        undefined,
        thisType,
        [],
        this.generator,
        undefined,
        []
      );
  
      const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
      const llvmArgumentTypes : LLVMType[] = [];
  
      return this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName).fn;
    }
}    