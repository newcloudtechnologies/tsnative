#include "aggregate.h"

using namespace cpp;

Aggregate::Aggregate(Point *point, Array<string *> *array, string *s, Number* n)
    : _point(point), _array{array}, _n(n), _s(s) {}

Point* Aggregate::getPoint() const { return _point; }
Array<string *>* Aggregate::getStringArray() const { return _array; }
string* Aggregate::getString() const { return _s; }
Number* Aggregate::getNumber() const { return _n; }