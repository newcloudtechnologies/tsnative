#pragma once

#include "point.h"
#include <std-typescript-llvm/include/array.h>
#include <std-typescript-llvm/include/stdstring.h>

namespace cpp {

class Aggregate {
public:
  Aggregate(Point *point, Array<string *> *array, string *s, double d,
            int8_t i);

  Point getPoint() const;
  Array<string *> getStringArray() const;
  string getString() const;
  double getDouble() const;
  int8_t getInt8() const;

private:
  Point _point;
  Array<string *> _array;
  string _s = "";
  double _d = 0;
  int8_t _i = 0;
};

} // namespace cpp
