import { LLVMGenerator } from "@generator";
import { TypeMangler } from "@mangling";
import { Scope } from "@scope";
import { addTypeArguments, getStructType } from "@utils";
import * as ts from "typescript";

export class ClassDeclarationEmitter {
  emitClassDeclaration(
    declaration: ts.ClassDeclaration,
    typeArguments: ReadonlyArray<ts.Type>,
    parentScope: Scope,
    generator: LLVMGenerator
  ): void {
    if (declaration.typeParameters && typeArguments.length === 0) {
      return;
    }

    const thisType = addTypeArguments(generator.checker.getTypeAtLocation(declaration), typeArguments);

    const mangledTypename: string = TypeMangler.mangle(thisType, generator.checker, declaration);
    const preExisting = generator.module.getTypeByName(mangledTypename);
    if (preExisting) {
      return;
    }
    const type = getStructType(thisType, declaration, generator);
    const scope = new Scope(mangledTypename, { declaration, type });
    parentScope.set(mangledTypename, scope);
    for (const method of declaration.members.filter(member => !ts.isPropertyDeclaration(member))) {
      generator.emitNode(method, scope);
    }
  }
}
