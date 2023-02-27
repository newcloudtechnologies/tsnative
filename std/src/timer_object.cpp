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

#include "std/timer_object.h"

#include "std/tsclosure.h"

#include <cassert>

TimerObject::TimerObject(TSClosure* closure)
    : Object(TSTypeID::Timer)
    , _closure{closure}
{
}

const TSClosure& TimerObject::getClosure() const
{
    assert(_closure && "TimerObject: Closure was nullptr");
    return *_closure;
}

std::vector<Object*> TimerObject::getChildObjects() const
{
    return {_closure};
}