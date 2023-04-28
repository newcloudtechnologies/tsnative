/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

// {
//   const a = [1];
//   console.assert((false && a[2] === 0) === false, "Boolean operator && short evaluation ")
// }

// {
//   const a = [1];
//   const b = false && a[2] === 0;
//   console.assert(b === false, "Boolean operator && short evaluation 2")
// }

// {
//   const a = undefined;
//   const b = true;
//   const c = false;
//   console.assert((a && b) === undefined, "Boolean operator && undefined 1");
//   console.assert((b && a) === undefined, "Boolean operator && undefined 2");
//   console.assert((a && c) === undefined, "Boolean operator && undefined 3");
//   console.assert((a && c) === undefined, "Boolean operator && undefined 4");
// }

{
  const b = true && true && true;
}

// {
//   const a = [1];
//   let c = 0;
//   if (false && a[2] === 0) {
//   } else {
//     c = 2;
//   }
//   console.assert(c === 2, "Boolean operator && in if condition");
// }

// {
//   const a = [1];
//   let c = 0;
//   while (false && a[2] === 0) {
//   };
//   console.assert(c === 0, "Boolean operator && in while condition");
// }

// {
//   const a = [1];
//   let c = 0;
//   do {
//     c += 1;
//   } while (false && a[2] === 0);
//   console.assert(c === 1, "Boolean operator && in do while condition");
// }

// {
//   const a = [1];
//   let c = 0;
//   for (let i = 0; false && a[2] === 0; i++) {
//   };
//   console.assert(c === 0, "Boolean operator && in for condition");
// }

// {
//   const a = [1];
//   let c = 0;
//   switch (false && a[2] === 0) {
//     case false : {
//       c = 1;
//       break;
//     }
//   };
//   console.assert(c === 1, "Boolean operator && in switch condition");
// }

// {
//  const a = undefined;
//  const b = true;
//  const c = false;
//  console.assert(a || b === true, "Boolean operator || undefined 1");
//  console.assert(b || a === true, "Boolean operator || undefined 2");
//  console.assert(a || c === false, "Boolean operator || undefined 3");
//  console.assert(c || a === undefined, "Boolean operator || undefined 4");
// }

// {
//   const a = [1];
//   const b = true || a[3] === 0;
//   console.assert(b === true, "Boolean operator || short evaluation ")
// }
