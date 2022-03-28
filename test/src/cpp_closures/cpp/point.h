#pragma once

#include <std/tsnumber.h>
#include <std/tsobject.h>

class Point : public Object
{
public:
  Point(Number *x, Number *y);

  const Number *x() const;
  const Number *y() const;
};