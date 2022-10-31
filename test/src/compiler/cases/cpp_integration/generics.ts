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

import { innerNS } from "cpp_integration_exts";
import { ClassWithTemplateMethod, ClassWithTemplateMembers, TemplateClassWithTemplateMethod } from "cpp_integration_exts";
// import { sum } from "cpp_integration_exts";

/* @todo: template parameters extraction from signature fails on this
sum<number, number>(1, 3);
sum<string, int32_t>("hello, ", "world");
*/

console.assert(innerNS.getGenericNumber<number>() === 42, "Generic 'innerNS.getGenericNumber<number>' test failed");
console.assert(innerNS.getGenericNumber<string>() === "forty two", "Generic 'innerNS.getGenericNumber<string>' test failed");

const classWTemplateMethod = new ClassWithTemplateMethod();
console.assert(classWTemplateMethod.getWithAdditionOfTwo<number>(3) === 5, "'ClassWTemplateMethod.getWithAdditionOfTwo<number>' test failed");
console.assert(classWTemplateMethod.getWithAdditionOfTwo<string>("3") === "3_2", "'ClassWTemplateMethod.getWithAdditionOfTwo<string>' test failed");

const classWNumberStringMembers = new ClassWithTemplateMembers<number, string>(42);
console.assert(classWNumberStringMembers.getFirst() === 42, "'ClassWithTemplateMembers<number, string>.get' test failed");

const classWStringStringMembers = new ClassWithTemplateMembers<string, string>("twenty two");
console.assert(classWStringStringMembers.getFirst() === "twenty two", "'ClassWithTemplateMembers<string, string>.get' test failed");

const templateClassWithTemplateMethod = new TemplateClassWithTemplateMethod(2);
console.assert(templateClassWithTemplateMethod.transform<number>(10) === 12, "'TemplateClassWithTemplateMethod.transform<number>' test failed");
// transformation result actually is "102.000000"; test with `startsWith` just in case
console.assert(templateClassWithTemplateMethod.transform<string>("10").startsWith("102"), "'TemplateClassWithTemplateMethod.transform<string>' test failed");
