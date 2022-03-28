#pragma once

#include "point.h"

#include <iostream>

#include <std/tsstring.h>
#include <std/tsobject.h>

namespace cpp
{

  class Printable : public Object
  {
  public:
    Printable(Point *point, String *s);
  };

} // namespace cpp
