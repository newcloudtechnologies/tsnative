#include "inheritance.h"

#include <std/gc.h>

using namespace cpp;

PointPair::PointPair(Number* x1, Number* y1, Number* x2, Number* y2)
    : topLeft({x1, y1}), bottomRight({x2, y2}) {}

Point *PointPair::getTopLeft() const {
  return GC::createHeapAllocated<Point>(topLeft);
}
Point *PointPair::getBottomRight() const {
  return GC::createHeapAllocated<Point>(bottomRight);
}

RectHolder::RectHolder(const Rect &rect) : rect(rect) {}
Rect *RectHolder::getRect() const {
  return GC::createHeapAllocated<Rect>(rect);
}

Mixin::Mixin(Number* x1, Number* y1, Number* x2, Number* y2)
    : PointPair(x1, y1, x2, y2), RectHolder({{x1, y1}, {x2, y2}}) {}

Mixin *Mixin::getScaled(Number* factor) const {
  return GC::createHeapAllocated<Mixin>(
      Mixin{topLeft.x()->mul(factor), topLeft.y()->mul(factor),
            bottomRight.x()->mul(factor), bottomRight.y()->mul(factor)});
}

VirtualBase::VirtualBase() {}
string *VirtualBase::virtualMethod() const { return GC::createHeapAllocated<string>(s); }

DerivedFromVirtualBase::DerivedFromVirtualBase() {}
const Number* DerivedFromVirtualBase::pureVirtualMethodToOverride() const {
  return &i;
}

DerivedFromBaseInOtherNamespace::DerivedFromBaseInOtherNamespace() {}