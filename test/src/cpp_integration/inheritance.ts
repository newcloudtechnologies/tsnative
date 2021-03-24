import { DerivedFromBaseInOtherNamespace } from "cpp";
import { DerivedFromVirtualBase, Mixin } from "./declarations/cpp";

const m = new Mixin(1, 1, 11, 11);
const r = m.getRect();
console.assert(r.getSquare() === 100, "Square test failed");

const topLeft = m.getTopLeft(); 
console.assert(topLeft.x() === 1, "Top left x test failed");
console.assert(topLeft.y() === 1, "Top left y test failed");

const bottomRight = m.getBottomRight();
console.assert(bottomRight.x() === 11, "Bottom right x test failed");
console.assert(bottomRight.y() === 11, "Bottom right y test failed");

const scaled = m.getScaled(10);
console.assert(scaled.getRect().getSquare() === 10000, "Scaled square test failed");

const scaledTopLeft = scaled.getTopLeft();
console.assert(scaledTopLeft.x() === 10, "Scaled top left x test failed");
console.assert(scaledTopLeft.y() === 10, "Scaled top left y test failed");

const scaledBottomRight = scaled.getBottomRight();
console.assert(scaledBottomRight.x() === 110, "Scaled bottom right x test failed");
console.assert(scaledBottomRight.y() === 110, "Scaled bottom right y test failed");

const derivedFromVirtualBase = new DerivedFromVirtualBase();
console.assert(derivedFromVirtualBase.virtualMethod() === "base virtual method", "'DerivedFromVirtualBase.virtualMethod' test failed");
console.assert(derivedFromVirtualBase.pureVirtualMethodToOverride() === 324, "'DerivedFromVirtualBase.pureVirtualMethodToOverride' test failed");

// Just test buildability
const d = new DerivedFromBaseInOtherNamespace;
d.test();