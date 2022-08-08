#pragma once

#include "std/private/icall_stack.h"

namespace test
{
class MockCallStack : public ICallStack
{
public:
    MOCK_METHOD(void, push, (CallStackFrame&&), (override));
    MOCK_METHOD(void, pop, (), (override));
    MOCK_METHOD((std::size_t), size, (), (const, override));
    MOCK_METHOD(bool, empty, (), (const, override));
    MOCK_METHOD((const CallStackFrame&), getFrameAtPosition, (std::size_t), (const, override));
    MOCK_METHOD((const CallStackFrame&), getParentFrame, (), (const, override));
    MOCK_METHOD((const CallStackFrame&), getCurrentFrame, (), (const, override));
};
} // test