#include "point.h"

Point::Point(Number* x, Number* y)
{
    set("x", x);
    set("y", y);
}

Number* Point::x() const
{
    return get<Number*>("x");
}
Number* Point::y() const
{
    return get<Number*>("y");
}

void Point::setX(Number* x)
{
    set("x", x);
}
void Point::setY(Number* y)
{
    set("y", y);
}
