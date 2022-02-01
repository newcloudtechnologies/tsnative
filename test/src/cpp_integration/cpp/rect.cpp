#include "rect.h"

#include <std/tsnumber.h>

using namespace cpp;

Rect::Rect(const Point &topLeft, const Point& bottomRight)
    : topLeft(topLeft), bottomRight(bottomRight) {}

Number* Rect::getSquare() {
  auto width = bottomRight.x()->sub(topLeft.x());
  auto height = bottomRight.y()->sub(topLeft.y());  
  return width->mul(height);
}

Array<Point*>* Rect::getDiagonal() const
{
  auto* p1 = GC::track(new Point(topLeft.x(), topLeft.y()));
  auto* p2 = GC::track(new Point(bottomRight.x(), bottomRight.y()));
  
  auto* coords = GC::track(new Array<Point*>);
  coords->push(p1);
  coords->push(p2);
  return coords;
}