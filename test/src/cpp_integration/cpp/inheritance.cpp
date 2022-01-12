#include "inheritance.h"

#include <std/gc.h>

using namespace cpp;

PointPair::PointPair(double x1, double y1, double x2, double y2)
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

Mixin::Mixin(double x1, double y1, double x2, double y2)
    : PointPair(x1, y1, x2, y2), RectHolder({{x1, y1}, {x2, y2}}) {}

Mixin *Mixin::getScaled(double factor) const {
  return GC::createHeapAllocated<Mixin>(
      Mixin{topLeft.x() * factor, topLeft.y() * factor,
            bottomRight.x() * factor, bottomRight.y() * factor});
}

VirtualBase::VirtualBase() {}
string *VirtualBase::virtualMethod() const { return GC::createHeapAllocated<string>(s); }

DerivedFromVirtualBase::DerivedFromVirtualBase() {}
TSNumber DerivedFromVirtualBase::pureVirtualMethodToOverride() const {
  return i;
}

DerivedFromBaseInOtherNamespace::DerivedFromBaseInOtherNamespace() {}