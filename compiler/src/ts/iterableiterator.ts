import { LLVMGenerator } from "../generator";
import { FunctionMangler } from "../mangling/functionmangler";
import { LLVMType } from "../llvm/type";
import { LLVMValue } from "../llvm/value";
import { Declaration } from "./declaration";

export class TSIterableIterator {
  private readonly generator: LLVMGenerator;

  private readonly iteratorFns = new Map<string, LLVMValue>();

  constructor(generator: LLVMGenerator) {
    this.generator = generator;
  }

  // Create iterator getter method from Iterable
  createIteratorGetterMethod(iterableDeclaration: Declaration, knownGenericTypes?: string[]) : LLVMValue {
    let id = iterableDeclaration.type.toString();
    if (knownGenericTypes) {
      id += knownGenericTypes.join();
    }

    if (this.iteratorFns.has(id)) {
      const iteratorFn = this.iteratorFns.get(id);
      if (!iteratorFn) {
        throw new Error(`Can't happen: Map.has() returned true and Map.get() returned undefined`);
      }      
      return this.iteratorFns.get(id)!;
    }

    const iteratorDeclaration = iterableDeclaration.members.find((m) => m.name?.getText() === "[Symbol.iterator]");

    if (!iteratorDeclaration) {
      throw new Error(`Unable to find '[Symbol.iterator]' at '${iterableDeclaration.getText()}'`);
    }

    const { qualifiedName, isExternalSymbol } = FunctionMangler.mangle(
      iteratorDeclaration,
      undefined,
      iterableDeclaration.type,
      [],
      this.generator,
      knownGenericTypes
    );

    if (!isExternalSymbol) {
      throw new Error(`Iterator for declaration '${iterableDeclaration.getText()}' not found`);
    }

    const { fn: iterator } = this.generator.llvm.function.create(
      LLVMType.getInt8Type(this.generator).getPointer(),
      [LLVMType.getInt8Type(this.generator).getPointer()],
      qualifiedName
    );

    this.iteratorFns.set(id, iterator);

    return iterator;
  }

  // Return iterator declaration from Iterable declaration
  getIteratorDeclaration(iterableDeclaration: Declaration) {
    const iteratorDeclaration = iterableDeclaration.members.find((m) => m.name?.getText() === "[Symbol.iterator]")!;
    const signature = this.generator.ts.checker.getSignatureFromDeclaration(iteratorDeclaration);
    const returnType = signature.getReturnType();
    const declaration = returnType.getSymbol().valueDeclaration;
    if (!declaration) {
      throw new Error(`Iterator declaration '${iterableDeclaration.getText()}' not found`);
    }
    return declaration;
  }
}
