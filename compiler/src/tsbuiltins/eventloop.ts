import { LLVMGenerator } from "../generator";
import { FunctionMangler } from "../mangling";
import { Declaration } from "../ts/declaration";
import { LLVMConstantInt, LLVMValue } from "../llvm/value";
import { LLVMType } from "../llvm/type";

import { Runtime } from "../tsbuiltins/runtime";

import * as ts from "typescript";

const stdlib = require("std/constants");

export class EventLoop {
  private readonly runLoopFn: LLVMValue;
  private readonly generator: LLVMGenerator;
  private readonly runtime: Runtime;
  private readonly eventLoopType: LLVMType;

  constructor(generator: LLVMGenerator, runtime: Runtime) {
    this.generator = generator;
    this.runtime = runtime;

    const declaration = this.findEventLoopDeclaration();
    this.eventLoopType = this.generator.ts.checker
      .getTypeAtLocation(declaration.unwrapped)
      .getLLVMType();

    this.runLoopFn = this.findRunLoopFunction(declaration, "run");
  }

  getEventLoopType(): LLVMType {
    return this.eventLoopType;
  }

  run(name?: string) {
    const eventLoopAddress = this.runtime.getEventLoopAddress();
    return this.generator.builder.createSafeCall(
      this.runLoopFn,
      [eventLoopAddress],
      name
    );
  }

  private findRunLoopFunction(declaration: Declaration, name: string) {
    const runLoopDeclaration = declaration.members.find(
      (m) => m.isMethod() && m.name?.getText() === name
    );
    if (!runLoopDeclaration) {
      throw Error(`Unable to find ${name} function`);
    }

    const thisType = this.generator.ts.checker.getTypeAtLocation(
      declaration.unwrapped
    );
    const { qualifiedName } = FunctionMangler.mangle(
      runLoopDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      undefined,
      []
    );

    const returnType = LLVMType.getInt32Type(this.generator);
    const llvmArgumentTypes = [thisType.getLLVMType()];

    const { fn: runFN } = this.generator.llvm.function.create(
      this.generator.builtinNumber.getLLVMType(),
      llvmArgumentTypes,
      qualifiedName
    );
    return runFN;
  }

  private findEventLoopDeclaration(): Declaration {
    const eventLoop = this.generator.program
      .getSourceFiles()
      .find(
        (sourceFile) => sourceFile.fileName === stdlib.EVENT_LOOP_DEFINITION
      );
    if (!eventLoop) {
      throw new Error("No std Event loop file found");
    }

    let result: Declaration | null = null;

    eventLoop.forEachChild((node) => {
      if (ts.isClassDeclaration(node)) {
        const clazz = Declaration.create(
          node as ts.ClassDeclaration,
          this.generator
        );
        const clazzName = clazz.type.getSymbol().escapedName;
        if (clazzName === "EventLoop") {
          result = clazz;
        }
      }
    });

    if (!result) {
      throw new Error("Event loop declaration not found");
    }
    return result!;
  }
}
