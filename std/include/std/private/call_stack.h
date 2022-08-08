#pragma once

#include <cstddef>
#include <functional>
#include <vector>

#include "icall_stack.h"

class CallStack final : public ICallStack
{
public:
    struct Callbacks final
    {
        std::function<void(const CallStackFrame&)> onFrameAdded = [](const CallStackFrame&){};
        std::function<void(const CallStackFrame&)> beforeFrameRemoved = [](const CallStackFrame&){};
    };

    void registerCallbacks(Callbacks&& cbs);

    void push(CallStackFrame&& newFrame);
    void pop();

    std::size_t size() const;
    bool empty() const;

    const CallStackFrame& getFrameAtPosition(std::size_t i) const;
    const CallStackFrame& getParentFrame() const;
    const CallStackFrame& getCurrentFrame() const;

private:
    void notifyOnFrameAdded(const CallStackFrame&);
    void notifyBeforeFrameRemoved(const CallStackFrame&);

private:
    std::vector<CallStackFrame> _frames;
    std::vector<Callbacks> _callbacks;
};