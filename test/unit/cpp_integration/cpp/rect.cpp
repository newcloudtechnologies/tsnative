#include "rect.h"

using namespace cpp;

Rect::Rect(const Point &topLeft, const Point &bottomRight)
    : topLeft(topLeft), bottomRight(bottomRight) {}

double Rect::getSquare() {
  return (bottomRight.x() - topLeft.x()) * (bottomRight.y() - topLeft.y());
}