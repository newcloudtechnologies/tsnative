#pragma once

#include <TS.h>
#include <std/tsobject.h>

class TS_EXPORT WithVirtualMethods : public Object
{
public:
    TS_METHOD WithVirtualMethods() = default;

    TS_METHOD virtual void methodOne() const = 0;
    TS_METHOD void methodTwo() const;
    TS_METHOD virtual void methodThree() const = 0;
};
