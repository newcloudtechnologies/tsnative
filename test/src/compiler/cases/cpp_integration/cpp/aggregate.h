#pragma once

#include <TS.h>

#include "point.h"
#include "rect.h"

#include <std/tsarray.h>
#include <std/tsobject.h>
#include <std/tsstring.h>

namespace cpp_integration IS_TS_MODULE
{

class TS_EXPORT Aggregate : public Object
{
public:
    TS_METHOD Aggregate(Point* point, Array<String*>* array, String* s, Number* d);

    TS_METHOD Point* getPoint() const;
    TS_METHOD Array<String*>* getStringArray() const;
    TS_METHOD String* getString() const;
    TS_METHOD Number* getNumber() const;
};

class PointPair : public Object
{
public:
    PointPair(Number* x1, Number* y1, Number* x2, Number* y2);

    Point* getTopLeft() const;
    Point* getBottomRight() const;

protected:
    Point* topLeft = nullptr;
    Point* bottomRight = nullptr;
};

class RectHolder : public Object
{
public:
    RectHolder(Rect* rect);

    Rect* getRect() const;

private:
    Rect* rect = nullptr;
};

class TS_EXPORT LargerAggregate : public Object
{
public:
    TS_METHOD LargerAggregate(Number* x1, Number* y1, Number* x2, Number* y2);

    TS_METHOD Point* getTopLeft() const;
    TS_METHOD Point* getBottomRight() const;

    TS_METHOD Rect* getRect() const;

    TS_METHOD LargerAggregate* getScaled(Number* factor) const;

private:
    PointPair* pointPair() const;
    RectHolder* rectHolder() const;
};

} // namespace IS_TS_MODULE
