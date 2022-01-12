#pragma once

#include "point.h"

#include <iostream>

#include <std/stdstring.h>

namespace cpp {

class Printable {
public:
  Printable(Point *point, string *s);

  friend std::ostream &operator<<(std::ostream &os, Printable *s);

private:
  Point point_;
  string string_;
};

inline std::ostream& operator<<(std::ostream& os, Printable* p)
{
    os << "Printable is:\n" << "Point:\n  x: " << p->point_.x() << "\n  y: " << p->point_.y() << "\nstring: " << p->string_;
    return os;
}

} // namespace cpp
