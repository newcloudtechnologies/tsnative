#pragma once

#include "point.h"

#include <iostream>

#include <std-typescript-llvm/include/stdstring.h>

namespace cpp {

class Printable {
public:
  Printable(Point *point, string *s, int32_t i);

  friend std::ostream &operator<<(std::ostream &os, Printable *s);

private:
  Point point_;
  string string_;
  int32_t i_;
};

inline std::ostream& operator<<(std::ostream& os, Printable* p)
{
    os << "Printable is:\n" << "Point:\n  x: " << p->point_.x() << "\n  y: " << p->point_.y() << "\nstring: " << p->string_ << "\nint32_t: " << p->i_;
    return os;
}

} // namespace cpp
