/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "button.h"
#include "point.h"

#include <std/tsclosure.h>

using namespace cpp_integration;

Button::Button()
{
}

void Button::onClicked(TSClosure* closure)
{
    set("onClicked", closure);
}

void Button::onClickedWithPoint(TSClosure* closure)
{
    set("onClickedWithPoint", closure);
}

void Button::click() const
{
    auto closure = get<TSClosure*>("onClicked");
    closure->call();
}

void Button::clickWithPoint(Point* point) const
{
    auto closure = get<TSClosure*>("onClickedWithPoint");

    closure->setEnvironmentElement(point, 0);
    closure->call();
}
