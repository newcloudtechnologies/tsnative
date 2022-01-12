#include "printable.h"

using namespace cpp;

Printable::Printable(Point *point, string *s)
    : point_(*point), string_(*s) {}