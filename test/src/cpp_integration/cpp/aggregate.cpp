#include "aggregate.h"

using namespace cpp;

Aggregate::Aggregate(Point *point, Array<String *> *array, String *s, Number* n)
    : _point(point), _array{array}, _n(n), _s(s) {}

Point* Aggregate::getPoint() const { return _point; }
Array<String *>* Aggregate::getStringArray() const { return _array; }
String* Aggregate::getString() const { return _s; }
Number* Aggregate::getNumber() const { return _n; }