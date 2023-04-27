/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import * as ts from "typescript";
import { LLVMGenerator } from "../generator";
import { Scope } from "../scope";

export class Hoisting {
  static hoistVariablesInScope(
    root: ts.Node,
    scope: Scope,
    generator: LLVMGenerator
  ) {
    const initializeFrom = (node: ts.Node) => {
      // ignore nested blocks and modules/namespaces
      if (ts.isBlock(node) || ts.isModuleBlock(node)) {
        return;
      }

      // ignore destructuring assignment since no scope values actually creating for them
      if (
        ts.isVariableDeclaration(node) &&
        ts.isArrayBindingPattern(node.name)
      ) {
        return;
      }

      // ignore counters
      if (
        ts.isVariableDeclarationList(node) &&
        ts.isIterationStatement(node.parent, false)
      ) {
        return;
      }

      node.forEachChild(initializeFrom);

      // only interested in variables and functions declarations
      if (!ts.isVariableDeclaration(node) && !ts.isFunctionDeclaration(node)) {
        return;
      }

      if (!node.name) {
        return;
      }

      const tsType = generator.ts.checker.getTypeAtLocation(node);
      if (!tsType.isSupported()) {
        // mkrv @todo resolve generic type
        return;
      }

      const llvmType = tsType.getLLVMType();
      const allocated = generator.gc.allocateObject(
        llvmType.getPointerElementType()
      );
      const inplaceAllocatedPtr = generator.ts.obj.createInplace(
        allocated,
        undefined
      );

      const inplaceAllocatedPtrPtr = generator.gc.allocate(
        inplaceAllocatedPtr.type
      );
      generator.builder.createSafeStore(
        inplaceAllocatedPtr,
        inplaceAllocatedPtrPtr
      );

      const name = node.name.getText();

      scope.set(name, inplaceAllocatedPtrPtr);
    };

    root.forEachChild(initializeFrom);
  }
}
