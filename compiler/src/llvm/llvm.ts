import { LLVMGenerator } from "../generator";
import { LLVMFunction } from "./function";

export class LLVM {
  readonly function: LLVMFunction;

  constructor(generator: LLVMGenerator) {
    this.function = new LLVMFunction(generator);
  }
}
