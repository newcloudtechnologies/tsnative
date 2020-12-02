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

import * as ts from "typescript";

export class StringLiteralHelper {
  static getOpenCurlyBracket() {
    return ts.createStringLiteral("{");
  }

  static getCloseCurlyBracket(nestedLevel: number = 0) {
    return ts.createStringLiteral(" ".repeat(nestedLevel * 2) + "}");
  }

  static createStringLiteral(text: string) {
    return ts.createStringLiteral(text);
  }

  static createNewLine() {
    return StringLiteralHelper.createStringLiteral("\n");
  }

  static createPropertyStringLiteral(property: string, nestedLevel: number = 0) {
    return ts.createStringLiteral(" ".repeat(nestedLevel * 2) + property.concat(":"));
  }
}
