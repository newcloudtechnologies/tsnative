#include "point.h"

Point::Point(Number* x, Number* y) : _x(x->valueOf()), _y(y->valueOf()) {}

const Number* Point::x() const { return &_x; }
const Number* Point::y() const { return &_y; }