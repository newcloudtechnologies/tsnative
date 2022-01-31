#include "printable.h"

using namespace cpp;

Printable::Printable(Point *point, String *s)
    : point_(*point), string_(*s) {}