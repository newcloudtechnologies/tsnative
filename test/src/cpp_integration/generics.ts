import { innerNS } from "./declarations/cpp";
import { sum, ClassWithTemplateMethod, ClassWithTemplateMembers, TemplateClassWithTemplateMethod } from "./declarations/generics";

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
console.assert(classWNumberStringMembers.get() === 42, "'ClassWithTemplateMembers<number, string>.get' test failed");

const classWStringStringMembers = new ClassWithTemplateMembers<string, string>("twenty two");
console.assert(classWStringStringMembers.get() === "twenty two", "'ClassWithTemplateMembers<string, string>.get' test failed");

const templateClassWithTemplateMethod = new TemplateClassWithTemplateMethod(2);
console.assert(templateClassWithTemplateMethod.transform<number>(10) === 12, "'TemplateClassWithTemplateMethod.transform<number>' test failed");
// transformation result actually is "102.000000"; test with `startsWith` just in case
console.assert(templateClassWithTemplateMethod.transform<string>("10").startsWith("102"), "'TemplateClassWithTemplateMethod.transform<string>' test failed");
