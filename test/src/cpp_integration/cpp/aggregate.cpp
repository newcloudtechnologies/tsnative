#include "aggregate.h"

using namespace cpp;

Aggregate::Aggregate(Point *point, Array<string *> *array, string *s, double d)
    : _point(point), _array{array}, _d(d), _s(s) {}

Point* Aggregate::getPoint() const { return _point; }
Array<string *>* Aggregate::getStringArray() const { return _array; }
string* Aggregate::getString() const { return _s; }
double Aggregate::getDouble() const { return _d; }