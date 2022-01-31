#include "point.h"

Point::Point(Number* x, Number* y) : _x(x->unboxed()), _y(y->unboxed()) {}

const Number* Point::x() const { return &_x; }
const Number* Point::y() const { return &_y; }