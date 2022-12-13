import * as ts from "typescript";

import { LLVMType } from "../llvm/type";
import { LLVMConstant } from "../llvm/value";
import { LLVMGenerator } from "../generator";

export class DummyArgumentsCreator {
    private generator: LLVMGenerator;
    
    constructor(generator: LLVMGenerator) {
      this.generator = generator;  
    }

    create(llvmArgumentTypes: LLVMType[]) {
      // these dummy arguments will be substituted by actual arguments once called
      return llvmArgumentTypes.map((t) => {
        if (t.getPointerLevel() !== 1) {
          throw new Error("Function argument types should be *");
        }

        let nullArg = LLVMConstant.createNullValue(t.unwrapPointer(), this.generator);

        const allocatedPtr = this.generator.gc.allocate(nullArg.type.unwrapPointer());
        this.generator.builder.createSafeStore(nullArg, allocatedPtr);
        nullArg = allocatedPtr;

        if (nullArg.type.isUnion()) {
          nullArg = this.generator.ts.union.create();
        }

        const nullArgPtrPtr = this.generator.gc.allocate(nullArg.type);
        this.generator.builder.createSafeStore(nullArg, nullArgPtrPtr);

        return nullArgPtrPtr;
      });
    }
}
