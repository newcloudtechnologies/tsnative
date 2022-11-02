/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

// @ts-nocheck
// suppress TS7029: Fallthrough case in switch.

{
  const switch_int = function (day: number): string {
    let result: string = "";

    switch (day) {
      case 0:
        result = "0";
        break;
      case 1:
        result = "1";
        break;
      default:
        result = "default";
        break;
      case 2:
        result = "2";
        break;
      case 3:
        result = "3";
        break;
      case 4:
        result = "4";
        break;
      case 5:
        result = "5";
        break;
      case 6:
        result = "6";
        break;
    }

    return result;
  }

  console.assert(switch_int(0) === "0", "switch: switch_int(0) failed");
  console.assert(switch_int(1) === "1", "switch: switch_int(1) failed");
  console.assert(switch_int(2) === "2", "switch: switch_int(2) failed");
  console.assert(switch_int(3) === "3", "switch: switch_int(3) failed");
  console.assert(switch_int(4) === "4", "switch: switch_int(4) failed");
  console.assert(switch_int(5) === "5", "switch: switch_int(5) failed");
  console.assert(switch_int(6) === "6", "switch: switch_int(6) failed");
  console.assert(switch_int(100) === "default", "switch: switch_int(100) failed");
}

{
  const switch_str = function (day: string): string {
    let result: string = "";

    switch (day) {
      case "Sunday":
        result = "Sunday";
        break;
      case "Monday":
        result = "Monday";
        break;
      default:
        result = "default";
        break;
      case "Tuesday":
        result = "Tuesday";
        break;
      case "Wednesday":
        result = "Wednesday";
        break;
      case "Thursday":
        result = "Thursday";
        break;
      case "Friday":
        result = "Friday";
        break;
      case "Saturday":
        result = "Saturday";
        break;
    }

    return result;
  }

  console.assert(switch_str("Sunday") === "Sunday", "switch: switch_str('Sunday') failed");
  console.assert(switch_str("Monday") === "Monday", "switch: switch_str('Monday') failed");
  console.assert(switch_str("Tuesday") === "Tuesday", "switch: switch_str('Tuesday') failed");
  console.assert(switch_str("Wednesday") === "Wednesday", "switch: switch_str('Wednesday') failed");
  console.assert(switch_str("Tuesday") === "Tuesday", "switch: switch_str('Tuesday') failed");
  console.assert(switch_str("Friday") === "Friday", "switch: switch_str('Friday') failed");
  console.assert(switch_str("Saturday") === "Saturday", "switch: switch_str('Saturday') failed");
  console.assert(switch_str("some day") === "default", "switch: switch_str('some day') failed");
}

{
  const switch_ret = function (day: number): number {

    switch (day) {
      case 0:
        return 0;
      case 1:
        return 1;
      case 2:
        return 2;
      case 3:
        return 3;
      case 4:
        return 4;
      case 5:
        return 5;
      case 6:
        return 6;
      case 7:
        return 7;
      default:
        return -1;
    }

    // @ts-ignore (skip unreachable code check)
    return 100;
  }

  console.assert(switch_ret(0) === 0, "switch: switch_ret(0) failed");
  console.assert(switch_ret(1) === 1, "switch: switch_ret(1) failed");
  console.assert(switch_ret(2) === 2, "switch: switch_ret(2) failed");
  console.assert(switch_ret(3) === 3, "switch: switch_ret(3) failed");
  console.assert(switch_ret(4) === 4, "switch: switch_ret(4) failed");
  console.assert(switch_ret(5) === 5, "switch: switch_ret(5) failed");
  console.assert(switch_ret(6) === 6, "switch: switch_ret(6) failed");
  console.assert(switch_ret(7) === 7, "switch: switch_ret(7) failed");
  console.assert(switch_ret(10) === -1, "switch: switch_ret(10) failed");
}

{
  const isBusinessDay = function (day: number): number {

    let result = -1;

    switch (day) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
        result = 0;
        break;
      case 5:
      case 6:
        result = 1;
        break;
      default:
        result = -1;
        break;
    }

    return result;
  }

  console.assert(isBusinessDay(0) === 0, "switch: isBusinessDay(0) failed");
  console.assert(isBusinessDay(1) === 0, "switch: isBusinessDay(1) failed");
  console.assert(isBusinessDay(2) === 0, "switch: isBusinessDay(2) failed");
  console.assert(isBusinessDay(3) === 0, "switch: isBusinessDay(3) failed");
  console.assert(isBusinessDay(4) === 0, "switch: isBusinessDay(4) failed");
  console.assert(isBusinessDay(5) === 1, "switch: isBusinessDay(5) failed");
  console.assert(isBusinessDay(6) === 1, "switch: isBusinessDay(6) failed");
  console.assert(isBusinessDay(10) === -1, "switch: isBusinessDay(10) failed");
}

{
  const withoutDefault = function (day: number): number {

    switch (day) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
        return 0;
      case 5:
      case 6:
        return 1;
    }

    return -1;
  }

  console.assert(withoutDefault(0) === 0, "switch: withoutDefault(0) failed");
  console.assert(withoutDefault(1) === 0, "switch: withoutDefault(1) failed");
  console.assert(withoutDefault(2) === 0, "switch: withoutDefault(2) failed");
  console.assert(withoutDefault(3) === 0, "switch: withoutDefault(3) failed");
  console.assert(withoutDefault(4) === 0, "switch: withoutDefault(4) failed");
  console.assert(withoutDefault(5) === 1, "switch: withoutDefault(5) failed");
  console.assert(withoutDefault(6) === 1, "switch: withoutDefault(6) failed");
  console.assert(withoutDefault(10) === -1, "switch: withoutDefault(10) failed");
}

{
  const breakMissing = function (x: number): number {

    let result = 0;

    switch (x) {
      case 0:
        result += 1;
      case 1:
        result += 2;
      case 2:
        result += 3;
        break;
      default:
        result += 100;
    }

    return result;
  }

  const breakMissingEmptyCase = function (x: number): number {

    let result = 0;

    switch (x) {
      case 0:
      case 10:
      case 11:
        result += 1;
      case 1:
      case 21:
      case 22:
      case 23:
        result += 2;
      case 2:
        result += 3;
        break;
      default:
        result += 100;
    }

    return result;
  }

  const noBreak = function (x: number): number {

    let result = 0;

    switch (x) {
      case 0:
        result += 1;
      case 1:
        result += 2;
      case 2:
        result += 3;
      default:
        result += 4;
    }

    return result;
  }

  console.assert(breakMissing(0) === 6, "switch: breakMissing(0) failed");
  console.assert(breakMissing(1) === 5, "switch: breakMissing(1) failed");
  console.assert(breakMissing(3) === 100, "switch: breakMissing(100) failed");

  console.assert(breakMissingEmptyCase(10) === 6, "switch: breakMissingEmptyCase(0) failed");
  console.assert(breakMissingEmptyCase(22) === 5, "switch: breakMissingEmptyCase(1) failed");

  console.assert(noBreak(0) === 10, "switch: noBreak(0) failed");
  console.assert(noBreak(1) === 9, "switch: noBreak(1) failed");
  console.assert(noBreak(2) === 7, "switch: noBreak(2) failed");
  console.assert(noBreak(3) === 4, "switch: noBreak(3) failed");
}

{
  const foo = function (x: number, n1: number, n2: number) {
    switch (x) {
      case 1:
        n1++;
      case 2:
        n2++;
    }

    return [n1, n2];
  }

  let n_case1 = 0;
  let n_case2 = 0;

  let r = foo(1, n_case1, n_case2);

  console.assert(r[0] === 1 && r[1] === 1, "switch: CasesNoDefaultNoAnyBreak(1) failed");

  n_case1 = 0; n_case2 = 0;
  r = foo(2, n_case1, n_case2);
  console.assert(r[0] === 0 && r[1] === 1, "switch: CasesNoDefaultNoAnyBreak(2) failed");

  n_case1 = 0; n_case2 = 0;
  r = foo(3, n_case1, n_case2);
  console.assert(r[0] === 0 && r[1] === 0, "switch: CasesNoDefaultNoAnyBreak(3) failed");
}

{
  const foo = function (x: number, n1: number, n2: number) {
    switch (x) {
      case 1:
        n1++;
      default:
        n2++;
    }

    return [n1, n2];
  }

  let n_case1 = 0;
  let n_case2 = 0;

  let r = foo(1, n_case1, n_case2);
  console.assert(r[0] === 1 && r[1] === 1, "switch: CasesDefaultNoAnyBreak(1) failed");

  r = foo(11, n_case1, n_case2);
  console.assert(r[0] === 0 && r[1] === 1, "switch: CasesDefaultNoAnyBreak(11) failed");
}

{
  const FOLDER_ICON = "./icons/png/file_manager_big_icon_folder_32_32.png";
  const FILE_ICON = "./icons/png/file_manager_big_icon_file_32_32.png";
  const DEFAULT_ICON = "icon";

  const FOLDER_TYPE = "folder";
  const FILE_TYPE = "file";
  const UNKNOWN_TYPE = "unknown";

  function getIcon(_type: string) {
    let icon = DEFAULT_ICON;

    switch (_type) {
      case FOLDER_TYPE: {
        icon = FOLDER_ICON;
        break;
      }
      case FILE_TYPE: {
        icon = FILE_ICON;
        break;
      }
      default: {
        break;
      }
    }

    return icon;
  }

  console.assert(getIcon(FOLDER_TYPE) === FOLDER_ICON, "Switch with blocked case clauses (1)");
  console.assert(getIcon(FILE_TYPE) === FILE_ICON, "Switch with blocked case clauses (2)");
  console.assert(getIcon(UNKNOWN_TYPE) === DEFAULT_ICON, "Switch with blocked case clauses (3)");
}

{
  const switch_int = function (day: number): string {
    let result: string = "INITIAL";

    switch (day) {
      default:
        result = "default";
    }

    return result;
  }

  console.assert(switch_int(0) === "default", "Only default switch");
}

{
  let result: string = "INITIAL";

  const switch_int = function (day: number): string {
    switch (day) { }

    return result;
  }

  console.assert(switch_int(0) === result, "Empty switch");
}

{
  const switch_int = function (day: number): string {
    let result: string = "INITIAL";
    const cond = true;

    switch (day) {
      case 0:
        if (cond) {
          result = "from condition";
          break;
        }
      default:
        result = "default";
    }

    return result;
  }

  console.assert(switch_int(0) === "from condition", "Conditional 'break'");
}

{
  const f = (i: number) => {
    switch (i) {
      case 0:
        return 1;
      default:
        console.log("default case triggered");
    }

    return;
  };
  console.assert(f(1) === undefined, "Unhadled switch-case value must return 'undefined'");
}
