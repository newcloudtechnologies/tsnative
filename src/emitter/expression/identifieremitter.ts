import * as llvm from "llvm-node";
import * as ts from "typescript";
import { LLVMGenerator } from "../../generator/generator";

export class IdentifierEmitter {
  emitIdentifier(expression: ts.Identifier, generator: LLVMGenerator): llvm.Value {
    return generator.symbolTable.get(expression.text) as llvm.Value;
  }

  emitThis(generator: LLVMGenerator): llvm.Value {
    return generator.symbolTable.get("this") as llvm.Value;
  }
}
