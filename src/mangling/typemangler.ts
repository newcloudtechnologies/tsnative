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

import { getTypeArguments, getTypeBaseName } from "@utils";
import * as ts from "typescript";

export class TypeMangler {
  static mangle(type: ts.Type, checker: ts.TypeChecker, declaration?: ts.Declaration): string {
    let suffix: string = "";
    const typename: string = checker.typeToString(type);
    if (this.typeToSuffixMap[typename]) {
      suffix = this.typeToSuffixMap[typename];
    } else {
      if (declaration) {
        if (ts.isInterfaceDeclaration(declaration)) {
          suffix = "interface";
        } else if (ts.isClassDeclaration(declaration)) {
          suffix = "class";
        }
      }
      this.typeToSuffixMap[typename] = suffix;
    }

    const typeArguments = getTypeArguments(type).map(typeArgument => this.mangle(typeArgument, checker));
    return [getTypeBaseName(type, checker), ...typeArguments].concat(suffix || []).join("__");
  }

  private static readonly typeToSuffixMap: { [type: string]: string } = {};
}
