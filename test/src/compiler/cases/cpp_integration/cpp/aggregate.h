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

class PointPair
{
public:
    PointPair(Number* x1, Number* y1, Number* x2, Number* y2);

    Point* getTopLeft() const;
    Point* getBottomRight() const;

protected:
    Point* topLeft = nullptr;
    Point* bottomRight = nullptr;
};

class RectHolder
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
