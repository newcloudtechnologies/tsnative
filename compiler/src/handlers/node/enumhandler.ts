import * as ts from "typescript";
import { AbstractNodeHandler } from "./nodehandler";
import { Scope, Environment } from "../../scope";
import { LLVMConstantFP } from "../../llvm/value";

export class EnumHandler extends AbstractNodeHandler {
  handle(node: ts.Node, parentScope: Scope, env?: Environment): boolean {
    if (ts.isEnumDeclaration(node)) {
      const enumName = node.name.getText();
      const enumObject = this.generator.ts.obj.create();

      // @todo:
      // enum E {
      //    v1 = 1,
      //    v2,
      //    v3...
      // }
      node.members.forEach((member, index) => {
        const memberName = member.name.getText();
        const memberInitializer = member.initializer;

        const value = memberInitializer
          ? this.generator.handleExpression(memberInitializer, env).derefToPtrLevel1()
          : this.generator.builtinNumber.create(LLVMConstantFP.get(this.generator, index));

        this.generator.ts.obj.set(enumObject, memberName, value);
      });

      parentScope.set(enumName, enumObject);

      return true;
    }

    if (this.next) {
      return this.next.handle(node, parentScope, env);
    }

    return false;
  }
}
