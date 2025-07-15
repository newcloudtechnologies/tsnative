import * as llvm from "llvm-node";
import { Declaration } from "../ts/declaration";
import * as ts from "typescript";

import { LLVMGenerator } from "../generator";
import { LLVMType } from "../llvm/type";
import { LLVMValue } from "../llvm/value";

export class LLVMFunction {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  create(returnType: LLVMType, parameterTypes: LLVMType[], name: string): { fn: LLVMValue; existing: boolean } {
    const fn = this.generator.module.getFunction(name);
    if (fn) {
      if (!fn.type.elementType.returnType.equals(returnType.unwrapped)) {
        throw new Error(
          `Function '${name}' already exists with different return type: existing - '${fn.type.elementType.returnType.toString()}, requested - '${returnType.toString()}'`
        );
      }

      if (
        fn.getArguments().length !== parameterTypes.length ||
        fn.getArguments().some((arg, index) => !arg.type.equals(parameterTypes[index].unwrapped))
      ) {
        throw new Error(
          `Function '${name}' already exists with different parameter types: existing - '${fn
            .getArguments()
            .map((arg) => arg.type.toString())
            .join(" ")}', requested - '${parameterTypes.map((type) => type.toString()).join(" ")}'`
        );
      }

      return { fn: LLVMValue.create(fn, this.generator), existing: true };
    }

    const type = llvm.FunctionType.get(
      returnType.unwrapped,
      parameterTypes.map((t) => t.unwrapped),
      false
    );

    return {
      fn: LLVMValue.create(
        llvm.Function.create(type, llvm.LinkageTypes.ExternalLinkage, name, this.generator.module),
        this.generator
      ),
      existing: false,
    };
  }

  static verify(fn: LLVMValue, source: ts.Expression | Declaration) {
    try {
      llvm.verifyFunction(fn.unwrapped as llvm.Function);
    } catch (err) {
      console.log(fn.generator.module.print())
      console.error(`Function verification failed at: '${source.getText()}'`);
      throw err;
    }
  }
}
