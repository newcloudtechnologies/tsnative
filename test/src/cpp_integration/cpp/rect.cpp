#include "rect.h"

using namespace cpp;

Rect::Rect(const Point &topLeft, const Point &bottomRight)
    : topLeft(topLeft), bottomRight(bottomRight) {}

double Rect::getSquare() {
  return (bottomRight.x() - topLeft.x()) * (bottomRight.y() - topLeft.y());
}

Array<Point*>* Rect::getDiagonal() const
{
  auto* p1 = GC::createHeapAllocated<Point>(Point{topLeft.x(), topLeft.y()});
  auto* p2 = GC::createHeapAllocated<Point>(Point{bottomRight.x(), bottomRight.y()});
  
  auto* coords = GC::createHeapAllocated<Array<Point*>>(Array<Point*>{});
  coords->push(p1);
  coords->push(p2);
  return coords;
}