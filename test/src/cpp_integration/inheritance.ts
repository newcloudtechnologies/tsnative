import { DerivedFromBaseInOtherNamespace } from "./declarations/cpp";
import { DerivedFromVirtualBase } from "./declarations/cpp";

const derivedFromVirtualBase = new DerivedFromVirtualBase();
console.assert(derivedFromVirtualBase.virtualMethod() === "base virtual method", "'DerivedFromVirtualBase.virtualMethod' test failed");
console.assert(derivedFromVirtualBase.pureVirtualMethodToOverride() === 324, "'DerivedFromVirtualBase.pureVirtualMethodToOverride' test failed");

// Just test buildability
const d = new DerivedFromBaseInOtherNamespace;
d.test();
