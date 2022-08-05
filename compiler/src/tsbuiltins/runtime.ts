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
    private openScopeFn: LLVMValue;
    private closeScopeFn: LLVMValue;

    constructor(declaration: Declaration, generator: LLVMGenerator) {
      this.generator = generator;

      this.getGCFn = this.findGetGC(declaration);
      const gcDeclaration = this.getGCDeclaration();
      this.gcType = this.generator.ts.checker.getTypeAtLocation(gcDeclaration.unwrapped).getLLVMType();

      this.garbageCollector = new GC(gcDeclaration, this.generator, this);

      this.openScopeFn = this.findScopeOpFunction(declaration, "openScope");
      this.closeScopeFn = this.findScopeOpFunction(declaration, "closeScope");
    }

    get gc() : GC {
        return this.garbageCollector!;
    }

    callOpenScope(handle: LLVMValue) {
      return this.generator.builder.createSafeCall(this.openScopeFn, [handle]);
    }

    callCloseScope(handle: LLVMValue) {
      return this.generator.builder.createSafeCall(this.closeScopeFn, [handle]);
    }

    callGetGC() : LLVMValue {
      const gcAddress = this.generator.builder.createSafeCall(this.getGCFn, []);
      return this.generator.builder.createBitCast(gcAddress, this.gcType);
    }

    private findScopeOpFunction(declaration: Declaration, name: string) {
      const methodDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === name);
      if (!methodDeclaration) {
          throw Error(`Unable to find ${name} function`);
      }

      const thisType = this.generator.ts.checker.getTypeAtLocation(declaration.unwrapped);
      const { qualifiedName } = FunctionMangler.mangle(
        methodDeclaration,
          undefined,
          thisType,
          [],
          this.generator,
          undefined,
          ["double"]
      );

      const llvmReturnType = LLVMType.getVoidType(this.generator);
      const llvmArgumentTypes = [LLVMType.getDoubleType(this.generator)];

      return this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName).fn;
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