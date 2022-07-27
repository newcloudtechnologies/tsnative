import { LLVMGenerator } from "../generator";
import { FunctionMangler } from "../mangling";
import { LLVMValue } from "../llvm/value";
import { Declaration } from "../ts/declaration";
import { LLVMType } from "../llvm/type";
import { GC } from "../tsbuiltins/gc";
import * as ts from "typescript";
import { BuiltinBoolean } from "../tsbuiltins/builtins"

const stdlib = require("std/constants");

export class Runtime {
    private readonly generator: LLVMGenerator;
    private garbageCollector: GC | undefined;

    private gcType : LLVMType;
    private getGCFn: LLVMValue;

    constructor(declaration: Declaration, generator: LLVMGenerator) {
      this.generator = generator;

      this.getGCFn = this.findGetGC(declaration);
      const gcDeclaration = this.getGCDeclaration();
      this.gcType = this.generator.ts.checker.getTypeAtLocation(gcDeclaration.unwrapped).getLLVMType();

      this.garbageCollector = new GC(gcDeclaration, this.generator, this);
    }

    get gc() : GC {
        return this.garbageCollector!;
    }

    callGetGC() : LLVMValue {
      const gcAddress = this.generator.builder.createSafeCall(this.getGCFn, []);
      return this.generator.builder.createBitCast(gcAddress, this.gcType);
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

    private getGCDeclaration() : Declaration {
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