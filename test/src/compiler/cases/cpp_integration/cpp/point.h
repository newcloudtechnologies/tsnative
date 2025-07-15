#pragma once

#include <TS.h>

#include <std/tsnumber.h>
#include <std/tsobject.h>

namespace cpp_integration IS_TS_MODULE
{

class TS_EXPORT Point : public Object
{
public:
    TS_METHOD Point(Number* x, Number* y);
    Point(const Point& other);

    TS_METHOD Number* x() const;
    TS_METHOD Number* y() const;

    TS_METHOD void setX(Number* x);
    TS_METHOD void setY(Number* y);

    TS_METHOD Point* clone() const;
};

} // namespace IS_TS_MODULE