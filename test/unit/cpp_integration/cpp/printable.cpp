#include "printable.h"

using namespace cpp;

Printable::Printable(Point *point, string *s, int64_t i)
    : point_(*point), string_(*s), i_(i) {}