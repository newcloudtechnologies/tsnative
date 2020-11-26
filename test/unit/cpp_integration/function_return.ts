import { ValueReturner } from "./declarations/function_return";

const returner = new ValueReturner();

const smallPod16 = returner.getSmallPod16();
console.assert(smallPod16.getValue() === 1, "Small pod 16 test failed");

const smallPod32 = returner.getSmallPod32();
console.assert(smallPod32.getValue() === 2, "Small pod 32 test failed");

const smallPodWithVirtualDestructor = returner.getSmallWithVirtualDestructor();
console.assert(smallPodWithVirtualDestructor.getValue() === 3, "Small pod with virtual destructor test failed");

/* @todo:
    "If the size of an object is larger than four eightbytes, or it contains unaligned fields, it has class MEMORY"

const smallUnaligned = returner.getSmallUnaligned();
console.assert(smallUnaligned.getValue() === 4, "Small unaligned test failed");
*/

const large = returner.getLarge();
console.assert(large.getValue() === 5, "Large test failed");
