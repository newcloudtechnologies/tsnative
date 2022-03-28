#include "rect.h"

#include <std/tsnumber.h>
#include <iostream>
using namespace cpp;

Rect::Rect(Point *topLeft, Point *bottomRight)
{
  set("tl", topLeft);
  set("br", bottomRight);
}

Point *Rect::topLeft() const
{
  return get<Point *>("tl");
}

Point *Rect::bottomRight() const
{
  return get<Point *>("br");
}

Number *Rect::getSquare()
{
  auto br = bottomRight();
  auto tl = topLeft();

  auto width = br->x()->sub(tl->x());
  auto height = br->y()->sub(tl->y());

  return width->mul(height);
}

Array<Point *> *Rect::getDiagonal() const
{
  auto br = bottomRight();
  auto tl = topLeft();

  auto *p1 = GC::track(new Point(tl->x(), tl->y()));
  auto *p2 = GC::track(new Point(br->x(), br->y()));

  auto *coords = GC::track(new Array<Point *>);
  coords->push(p1);
  coords->push(p2);
  return coords;
}
