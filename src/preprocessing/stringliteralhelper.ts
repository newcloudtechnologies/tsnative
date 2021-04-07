/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

export class StringLiteralHelper {
  static get openCurlyBracket() {
    return "{";
  }

  static getCloseCurlyBracket(spaces: number = 0) {
    return " ".repeat(spaces) + "}";
  }

  static get newLine() {
    return "\n";
  }

  static get space() {
    return " ";
  }

  static get empty() {
    return "";
  }

  static createPropertyStringLiteral(property: string, spaces: number = 0) {
    return " ".repeat(spaces) + property.concat(": ");
  }
}
