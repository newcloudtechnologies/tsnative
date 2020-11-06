/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import { checkIfArray, getTypeGenericArguments, getTypename } from "@utils";
import * as ts from "typescript";

export class TypeMangler {
  static mangle(type: ts.Type, checker: ts.TypeChecker, declaration?: ts.Declaration): string {
    if (checkIfArray(type)) {
      const types = getTypeGenericArguments(type)
        .map((typeArgument) => checker.typeToString(typeArgument))
        .join("_");
      return "Array__" + types + "__class";
    }

    if (declaration) {
      if (
        ts.isMethodDeclaration(declaration) ||
        ts.isGetAccessorDeclaration(declaration) ||
        ts.isSetAccessorDeclaration(declaration)
      ) {
        declaration = declaration.parent;
      }
    }

    let suffix: string = "";
    const typename: string = checker.typeToString(checker.getApparentType(type));
    if (typename === "String" || typename === "string") {
      return "string";
    }

    if (declaration) {
      if (ts.isInterfaceDeclaration(declaration)) {
        suffix = "interface";
      } else if (ts.isClassDeclaration(declaration)) {
        suffix = "class";
      }
    }

    const typeArguments = getTypeGenericArguments(type).map((typeArgument) => this.mangle(typeArgument, checker));
    return [getTypename(type, checker), ...typeArguments].concat(suffix || []).join("__");
  }
}
