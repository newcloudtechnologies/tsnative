#pragma once

#include "point.h"
#include <std/array.h>
#include <std/stdstring.h>

namespace cpp {

class Aggregate {
public:
  Aggregate(Point *point, Array<string *> *array, string *s, double d);

  Point *getPoint() const;
  Array<string *> *getStringArray() const;
  string *getString() const;
  double getDouble() const;

private:
  Point *_point = nullptr;
  Array<string *> *_array = nullptr;
  string *_s = nullptr;
  double _d = 0;
};

} // namespace cpp
