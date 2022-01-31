#pragma once

#include "point.h"
#include <std/tsarray.h>
#include <std/tsstring.h>

namespace cpp {

class Aggregate {
public:
  Aggregate(Point *point, Array<String *> *array, String *s, Number* d);

  Point *getPoint() const;
  Array<String *> *getStringArray() const;
  String *getString() const;
  Number* getNumber() const;

private:
  Point *_point = nullptr;
  Array<String *> *_array = nullptr;
  String *_s = nullptr;
  Number* _n = nullptr;
};

} // namespace cpp
