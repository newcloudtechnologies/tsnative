/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
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
