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

#include "aggregate.h"

using namespace cpp_integration;

Aggregate::Aggregate(Point* point, Array<String*>* array, String* s, Number* n)
{
    set("point", point);
    set("array", array);
    set("s", s);
    set("n", n);
}

Point* Aggregate::getPoint() const
{
    return get<Point*>("point");
}
Array<String*>* Aggregate::getStringArray() const
{
    return get<Array<String*>*>("array");
}
String* Aggregate::getString() const
{
    return get<String*>("s");
}
Number* Aggregate::getNumber() const
{
    return get<Number*>("n");
}

PointPair::PointPair(Number* x1, Number* y1, Number* x2, Number* y2)
    : topLeft(new Point{x1, y1})
    , bottomRight(new Point{x2, y2})
{
}

Point* PointPair::getTopLeft() const
{
    return topLeft;
}

Point* PointPair::getBottomRight() const
{
    return bottomRight;
}

RectHolder::RectHolder(Rect* rect)
    : rect(rect)
{
}

Rect* RectHolder::getRect() const
{
    return rect;
}

LargerAggregate::LargerAggregate(Number* x1, Number* y1, Number* x2, Number* y2)
{
    auto pair = new PointPair(x1, y1, x2, y2);
    auto rect = new Rect(pair->getTopLeft(), pair->getBottomRight());
    auto holder = new RectHolder(rect);

    set("pointPair", pair);
    set("rectHolder", holder);
}

PointPair* LargerAggregate::pointPair() const
{
    return get<PointPair*>("pointPair");
}

RectHolder* LargerAggregate::rectHolder() const
{
    return get<RectHolder*>("rectHolder");
}

Point* LargerAggregate::getTopLeft() const
{
    return pointPair()->getTopLeft();
}

Point* LargerAggregate::getBottomRight() const
{
    return pointPair()->getBottomRight();
}

Rect* LargerAggregate::getRect() const
{
    return rectHolder()->getRect();
}

LargerAggregate* LargerAggregate::getScaled(Number* factor) const
{
    auto tl = getTopLeft();
    auto br = getBottomRight();

    return new LargerAggregate{tl->x()->mul(factor), tl->y()->mul(factor), br->x()->mul(factor), br->y()->mul(factor)};
}