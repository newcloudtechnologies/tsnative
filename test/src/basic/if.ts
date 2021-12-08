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

{
  const _if_then = function (condition: boolean): string {
    if (condition) {
      return "then_branch"
    }

    return "passed_by_if";
  }

  const _if_then_else = function (condition: boolean): string {
    if (condition) {
      return "then_branch"
    }
    else {
      return "else_branch"
    }

    // @ts-ignore (skip unreachable code check)
    return "passed_by_if";
  }

  console.assert(_if_then(true) === "then_branch", "if: _if_then(true) === 'then_branch' failed");
  console.assert(_if_then(false) === "passed_by_if", "if: _if_then(false) === 'passed_by_if' failed");
  console.assert(_if_then_else(true) === "then_branch", "if: _if_then_else(true) === 'then_branch' failed");
  console.assert(_if_then_else(false) === "else_branch", "if: _if_then_else(false) === 'else_branch' failed");
}
