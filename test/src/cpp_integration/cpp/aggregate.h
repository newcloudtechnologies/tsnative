#pragma once

#include "point.h"
#include <std/array.h>
#include <std/stdstring.h>

namespace cpp {

class Aggregate {
public:
  Aggregate(Point *point, Array<string *> *array, string *s, Number* d);

  Point *getPoint() const;
  Array<string *> *getStringArray() const;
  string *getString() const;
  Number* getNumber() const;

private:
  Point *_point = nullptr;
  Array<string *> *_array = nullptr;
  string *_s = nullptr;
  Number* _n = nullptr;
};

} // namespace cpp
