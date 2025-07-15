#include "printable.h"

using namespace cpp_integration;

Printable::Printable(Point* point, String* s)
{
    set("point", point->clone());
    set("string", s->clone());
}
