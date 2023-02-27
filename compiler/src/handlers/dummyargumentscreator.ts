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
        
        const allocatedPtr = this.generator.gc.allocateObject(t.getPointerElementType());
        this.generator.ts.obj.createInplace(allocatedPtr);
        let nullArg = allocatedPtr;

        if (nullArg.type.isUnion()) {
          nullArg = this.generator.ts.union.create();
        }

        const nullArgPtrPtr = this.generator.gc.allocate(nullArg.type);
        this.generator.builder.createSafeStore(nullArg, nullArgPtrPtr);

        return nullArgPtrPtr;
      });
    }
}
