#pragma once

#include "call_stack_frame.h"

class ICallStack
{
public:
    virtual ~ICallStack() = default;

    virtual void push(CallStackFrame&& newFrame) = 0;
    virtual void pop() = 0;

    virtual std::size_t size() const = 0;
    virtual bool empty() const = 0;

    virtual const CallStackFrame& getFrameAtPosition(std::size_t i) const = 0;
    virtual const CallStackFrame& getParentFrame() const = 0;
    virtual const CallStackFrame& getCurrentFrame() const = 0;
};