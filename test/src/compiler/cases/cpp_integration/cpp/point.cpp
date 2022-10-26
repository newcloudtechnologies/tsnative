/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "point.h"

#include <std/tsnumber.h>

using namespace cpp_integration;

Point::Point(Number* x, Number* y)
{
    set("x", x);
    set("y", y);
}

Point::Point(const Point& other)
{
    setX(other.get<Number*>("x"));
    setY(other.get<Number*>("y"));
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

Point* Point::clone() const
{
    return new Point(*this);
}