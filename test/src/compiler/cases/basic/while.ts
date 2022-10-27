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

let i = 0;

while (i < 2)
  ++i;
console.assert(i === 2, "while: unscoped failed");

i = 0;
while (i < 2) {
  ++i;
  if (i === 1) {
    continue;
  }
  console.assert(i === 2, "while: scoped continue failed");
}

i = 0;
while (i < 2) {
  ++i;
  if (i === 1)
    continue;
  console.assert(i === 2, "while: continue failed");
}

i = 0;
while (i < 2) {
  ++i;
  if (i === 1) {
    break;
  }
}
console.assert(i === 1, "while: scoped break failed");

i = 0;
while (i < 2) {
  ++i;
  if (i === 1)
    break;
}
console.assert(i === 1, "while: break failed");

{
  const arr = [1, 2]

  let counter = 0;

  while (true) {
      const flagB = true

      for (const _ of arr) {
          ++counter;
      }

      ++counter;

      if (flagB) {
          break;
      }
  }

  console.assert(counter === 3, "'break' must works correctly if there is a nested loop");
}

// Test conditionless 'break'
{
  while (true) {
      break;
  }
}
