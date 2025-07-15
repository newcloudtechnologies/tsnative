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
    if (!_closure)
    {
        throw std::runtime_error("No valid closure");
    }

    return *_closure;
}

std::vector<Object*> TimerObject::getChildObjects() const
{
    return {_closure};
}