#pragma once

#include "point.h"

#include <iostream>

#include <std/tsstring.h>

namespace cpp {

class Printable {
public:
  Printable(Point *point, String *s);

  friend std::ostream &operator<<(std::ostream &os, Printable *s);

private:
  Point point_;
  String string_;
};

inline std::ostream& operator<<(std::ostream& os, Printable* p)
{
    os << "Printable is:\n" << "Point:\n  x: " << p->point_.x() << "\n  y: " << p->point_.y() << "\nstring: " << p->string_.cpp_str();
    return os;
}

} // namespace cpp
