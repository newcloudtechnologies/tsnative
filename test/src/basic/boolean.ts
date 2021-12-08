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
  const assign_true = (x: boolean): boolean => {
    let a = false;
    a = x;
    return a;
  };

  const assign_false = (x: boolean): boolean => {
    let a = true;
    a = x;
    return a;
  };

  const toggle = (x: boolean): boolean => {
    x = !x;
    return x;
  };

  console.assert(assign_true(true) === true, "boolean: assign_true(true) failed");
  console.assert(assign_false(false) === false, "boolean: assign_false(false) failed");
  console.assert(toggle(false) === true, "boolean: toggle(false) failed");
  console.assert(toggle(true) === false, "boolean: toggle(true) failed");
}

{
  const f1 = () => 1;
  const f2 = () => 2;

  console.assert((f2() === 2 ? f2 : f1)() === 2, "Ternary operator test failed");
}