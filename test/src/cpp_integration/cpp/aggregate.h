#pragma once

#include "point.h"
#include "rect.h"

#include <std/tsarray.h>
#include <std/tsstring.h>
#include <std/tsobject.h>

namespace cpp
{

  class Aggregate : public Object
  {
  public:
    Aggregate(Point *point, Array<String *> *array, String *s, Number *d);

    Point *getPoint() const;
    Array<String *> *getStringArray() const;
    String *getString() const;
    Number *getNumber() const;
  };

  class PointPair
  {
  public:
    PointPair(Number *x1, Number *y1, Number *x2, Number *y2);

    Point *getTopLeft() const;
    Point *getBottomRight() const;

  protected:
    Point *topLeft = nullptr;
    Point *bottomRight = nullptr;
  };

  class RectHolder
  {
  public:
    RectHolder(Rect *rect);

    Rect *getRect() const;

  private:
    Rect *rect = nullptr;
  };

  class LargerAggregate : public Object
  {
  public:
    LargerAggregate(Number *x1, Number *y1, Number *x2, Number *y2);

    Point *getTopLeft() const;
    Point *getBottomRight() const;

    Rect *getRect() const;

    LargerAggregate *getScaled(Number *factor) const;

  private:
    PointPair *pointPair() const;
    RectHolder *rectHolder() const;
  };

} // namespace cpp
