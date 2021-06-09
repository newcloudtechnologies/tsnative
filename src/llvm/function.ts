/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import * as llvm from "llvm-node";

import { LLVMGenerator } from "@generator";
import { error } from "@utils";

export class LLVMFunction {
  private readonly generator: LLVMGenerator;

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  create(returnType: llvm.Type, parameterTypes: llvm.Type[], name: string): { fn: llvm.Function; existing: boolean } {
    const fn = this.generator.module.getFunction(name);
    if (fn) {
      if (!fn.type.elementType.returnType.equals(returnType)) {
        error(
          `Function '${name}' already exists with different return type: existing - '${fn.type.elementType.returnType.toString()}, requested - '${returnType.toString()}'`
        );
      }

      if (
        fn.getArguments().length !== parameterTypes.length ||
        fn.getArguments().some((arg, index) => !arg.type.equals(parameterTypes[index]))
      ) {
        error(
          `Function '${name}' already exists with different parameter types: existing - '${fn
            .getArguments()
            .map((arg) => arg.type.toString())
            .join(" ")}', requested - '${parameterTypes.map((type) => type.toString()).join(" ")}'`
        );
      }

      return { fn, existing: true };
    }

    const type = llvm.FunctionType.get(returnType, parameterTypes, false);
    return {
      fn: llvm.Function.create(type, llvm.LinkageTypes.ExternalLinkage, name, this.generator.module),
      existing: false,
    };
  }
}
