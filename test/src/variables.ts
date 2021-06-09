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

function foo(param: number) {
  const localConst = param + param, localParamAlias = param;
  let localLet = localConst + param;
  const localAllocaAlias = localLet;
  localLet = localConst;
  var localVar = localAllocaAlias;
  localVar = localParamAlias + localLet;
  return localVar;
}

console.assert(foo(1) === 3, "variables: foo(1) === 3 failed");
