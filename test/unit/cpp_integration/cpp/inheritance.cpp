#include "inheritance.h"

using namespace cpp;

PointPair::PointPair(double x1, double y1, double x2, double y2)
    : topLeft({x1, y1}), bottomRight({x2, y2}) {}

Point PointPair::getTopLeft() const { return topLeft; }
Point PointPair::getBottomRight() const { return bottomRight; }

RectHolder::RectHolder(const Rect &rect) : rect(rect) {}
Rect RectHolder::getRect() const { return rect; }

Mixin::Mixin(double x1, double y1, double x2, double y2)
    : PointPair(x1, y1, x2, y2), RectHolder({{x1, y1}, {x2, y2}}) {}

Mixin Mixin::getScaled(double factor) const {
  const auto topLeft = getTopLeft();
  const auto bottomRight = getBottomRight();
  return {topLeft.x() * factor, topLeft.y() * factor, bottomRight.x() * factor,
          bottomRight.y() * factor};
}

VirtualBase::VirtualBase() {}
string VirtualBase::virtualMethod() const { return s; }

DerivedFromVirtualBase::DerivedFromVirtualBase() {}
int32_t DerivedFromVirtualBase::pureVirtualMethodToOverride() const { return i; }
