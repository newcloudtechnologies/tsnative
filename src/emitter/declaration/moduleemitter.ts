import { LLVMGenerator } from "@generator";
import { Scope } from "@scope";
import * as ts from "typescript";

export class ModuleDeclarationEmitter {
  emitModuleDeclaration(declaration: ts.ModuleDeclaration, parentScope: Scope, generator: LLVMGenerator): void {
    const name = declaration.name.text;
    const scope = new Scope(name);
    declaration.body!.forEachChild(node => generator.emitNode(node, scope));
    parentScope.set(name, scope);
  }
}
