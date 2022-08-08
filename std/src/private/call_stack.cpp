#include "std/private/call_stack.h"

void CallStack::registerCallbacks(Callbacks&& cbs)
{
    _callbacks.push_back(std::move(cbs));
}

void CallStack::notifyOnFrameAdded(const CallStackFrame& frame)
{
    for (auto& cb : _callbacks)
    {
        cb.onFrameAdded(frame);
    }
}

void CallStack::notifyBeforeFrameRemoved(const CallStackFrame& frame)
{
    for (auto& cb : _callbacks)
    {
        cb.beforeFrameRemoved(frame);
    }
}

void CallStack::push(CallStackFrame&& newFrame)
{
    _frames.push_back(std::move(newFrame));
    notifyOnFrameAdded(_frames.back());
}

void CallStack::pop()
{
    if (_frames.empty())
    {
        throw std::runtime_error("CallStack: popping from empty stack");
    }

    notifyBeforeFrameRemoved(getCurrentFrame());
    _frames.pop_back();
}

std::size_t CallStack::size() const
{
    return _frames.size();
}

bool CallStack::empty() const
{
    return _frames.empty();
}

const CallStackFrame& CallStack::getFrameAtPosition(std::size_t i) const
{
    if (size() <= i)
    {
        throw std::runtime_error("CallStack: no ith frame, stack has lesser size");
    }

    return _frames[i];
}

const CallStackFrame& CallStack::getParentFrame() const
{
    if (size() < 2)
    {
        throw std::runtime_error("CallStack: no parent frame, stack has 0 or 1 frame");
    }

    return _frames[_frames.size() - 2];
}

const CallStackFrame& CallStack::getCurrentFrame() const
{
    if (_frames.empty())
    {
        throw std::runtime_error("CallStack: no current frame, stack is empty");
    }
    return _frames.back();
}