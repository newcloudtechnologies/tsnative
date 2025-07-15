import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment, HeapVariableDeclaration } from "../../scope";
import { LLVMGlobalVariable, LLVMConstant, LLVMValue } from "../../llvm/value";

export class ModuleHandler extends AbstractNodeHandler {
  private knownNamespaces = new Map<string, LLVMValue>();

  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isModuleDeclaration(node)) {
      const declaration = node as ts.ModuleDeclaration;

      if (!declaration.body) {
        throw new Error(`Expected body for module declaration ${declaration.getText()}`);
      }

      if (!this.isNamespace(node)) {
        declaration.body.forEachChild((childNode) => this.generator.handleNode(childNode, parentScope, env));
        return true;
      }

      this.handleNamespace(declaration, parentScope, env);

      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }

  private isNamespace(node: ts.Node) {
    return (node.flags & ts.NodeFlags.Namespace) !== 0;
  }

  private getOrCreateNamespace(thisNamespace: ts.ModuleDeclaration) {
    const fullName = this.computeFullNamespaceName(thisNamespace);

    const maybeNamespacePtrPtr = this.knownNamespaces.get(fullName);
    if (maybeNamespacePtrPtr) {
        return maybeNamespacePtrPtr;
    }

    const namespaceObjectPtr = this.generator.ts.obj.create();
    const objectType = this.generator.ts.obj.getLLVMType();
    const nullValue = LLVMConstant.createNullValue(objectType, this.generator);
    const namespaceGlobalObjectPtrPtr = LLVMGlobalVariable.make(this.generator, objectType, false, nullValue, fullName);
    this.generator.builder.createSafeStore(namespaceObjectPtr, namespaceGlobalObjectPtrPtr);

    this.knownNamespaces.set(fullName, namespaceGlobalObjectPtrPtr);
    return namespaceGlobalObjectPtrPtr;
  }

  private getNextParent(namespace: ts.ModuleDeclaration): ts.ModuleDeclaration | undefined {
    let probe:ts.Node = namespace.parent;

    while(true) {
      if (ts.isSourceFile(probe)) {
        return undefined;
      }

      if (ts.isModuleDeclaration(probe)) {
        return probe as ts.ModuleDeclaration;
      }

      probe = probe.parent;
    }
  }

  private getNamespaceChain(end: ts.ModuleDeclaration) {
    let probe = end;
    const result = [end];
    while (true) {
      const next = this.getNextParent(probe);
      if (!next) {
        return result.reverse();
      }

      result.push(next);
      probe = next;
    }
  }

  private getNamespaceName(declaration: ts.ModuleDeclaration) {
    return declaration.name.getText().replace(/\"/g, "");
  }

  private computeFullNamespaceName(ns: ts.ModuleDeclaration) {
    const nsChain = this.getNamespaceChain(ns);
    let result = "";
    for (const ns of nsChain) {
      result += this.getNamespaceName(ns) + ".";
    }

    return result;
  }

  private fillNamespaceObject(thisNamespace: ts.ModuleDeclaration, 
                              thisNamespacePtr: LLVMValue, 
                              parentScope: Scope, 
                              env?: Environment) {
    const thisNamespaceName = this.getNamespaceName(thisNamespace);

    this.generator.symbolTable.withLocalScope((scope: Scope) => 
    {
      thisNamespace.body!.forEachChild(childNode => {
        this.generator.handleNode(childNode, scope, env);
      });
  
      // Handles everything that has LLVM value.
      // Other things like classes, interfaces, type aliases are just skipped
      // All those things should be implemented as objects. Hence they will have LLVM Value.
      for(const [n, v] of scope.map) {
        if (!(v instanceof Scope)) {
          const llvmValue = v instanceof HeapVariableDeclaration ? v.allocated : v;
          this.generator.ts.obj.set(thisNamespacePtr, n, llvmValue);
        }
      }
    }, parentScope, thisNamespaceName);
  }

  // namespace A {
  //      namespace B {
  // Take namespace object A and put namespace object B to A's props.
  private linkChildNamespace(thisNamespaceObjPtr: LLVMValue,
                              thisNamespace: ts.ModuleDeclaration, 
                              parentNamespace: ts.ModuleDeclaration, 
                              scope: Scope) {
    thisNamespaceObjPtr = thisNamespaceObjPtr.derefToPtrLevel1();

    const thisNamespaceName = this.getNamespaceName(thisNamespace);
    const parentNamespaceName = this.getNamespaceName(parentNamespace);

    const parentNamespacePtrPtr = scope.tryGetThroughParentChain(parentNamespaceName);
    if (!parentNamespacePtrPtr || !(parentNamespacePtrPtr instanceof LLVMValue)) {
      return;
    }

    this.generator.ts.obj.set(parentNamespacePtrPtr.derefToPtrLevel1(), thisNamespaceName, thisNamespaceObjPtr);
  }

  private putNamespaceIntoScope(thisNamespace: ts.ModuleDeclaration, thisNamespacePtrPtr: LLVMValue, scope: Scope) {
    const thisNamespaceName = this.getNamespaceName(thisNamespace);
    const existingNamespacePtrPtr = scope.tryGetThroughParentChain(thisNamespaceName);
    if (existingNamespacePtrPtr) {
      return;
    }

    scope.set(thisNamespaceName, thisNamespacePtrPtr, true);
  }

  private handleNamespace(thisNamespace: ts.ModuleDeclaration, parentScope: Scope, env?: Environment) {
    const thisNamespacePtrPtr = this.getOrCreateNamespace(thisNamespace);
    const thisNamespacePtr = thisNamespacePtrPtr.derefToPtrLevel1();

    const parentNamespace = this.getNextParent(thisNamespace);
    if (parentNamespace) {
      this.linkChildNamespace(thisNamespacePtr, thisNamespace, parentNamespace, parentScope);
    }

    this.putNamespaceIntoScope(thisNamespace, thisNamespacePtrPtr, parentScope);

    this.fillNamespaceObject(thisNamespace, thisNamespacePtr, parentScope, env);
  }
}
