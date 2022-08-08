#pragma once

#include <cstddef>

#include "std/private/call_stack_frame.h"

class Object;

class IGCImpl
{
public:
    virtual ~IGCImpl() = default;
    
    virtual std::size_t getAliveObjectsCount() const = 0;

    virtual void collect() = 0;
};
