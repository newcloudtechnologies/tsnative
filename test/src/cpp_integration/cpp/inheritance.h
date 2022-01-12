#pragma once

#include <cstdint>

#include "dummy_base.h"
#include "point.h"
#include "rect.h"

#include <std/stdstring.h>
#include <std/tsnumber.h>

namespace cpp {

class PointPair {
public:
  PointPair(double x1, double y1, double x2, double y2);

  Point *getTopLeft() const;
  Point *getBottomRight() const;

protected:
  Point topLeft;
  Point bottomRight;
};

class RectHolder {
public:
  RectHolder(const Rect &rect);

  Rect *getRect() const;

private:
  Rect rect;
};

class Mixin : public PointPair, public RectHolder {
public:
  Mixin(double x1, double y1, double x2, double y2);

  Mixin *getScaled(double factor) const;
};

class VirtualBase {
public:
  VirtualBase();
  virtual ~VirtualBase() = default;

  virtual string* virtualMethod() const;
  virtual TSNumber pureVirtualMethodToOverride() const = 0;

private:
  string s{"base virtual method"};
};

class DerivedFromVirtualBase : public VirtualBase {
public:
  DerivedFromVirtualBase();
  ~DerivedFromVirtualBase() override = default;

  TSNumber pureVirtualMethodToOverride() const override;

private:
  TSNumber i{324};
};

class DerivedFromBaseInOtherNamespace : public test::Base {
public:
  DerivedFromBaseInOtherNamespace();
};

} // namespace cpp
