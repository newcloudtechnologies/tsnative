#pragma once

#include <gmock/gmock.h>

#include "std/ievent_loop.h"

namespace test
{

class MockEventLoop final : public IEventLoop
{
public:
    MOCK_METHOD(int, run, (), (override));
    MOCK_METHOD(void, stop, (), (override));

    MOCK_METHOD(bool, isRunning, (), (const, override));

    MOCK_METHOD(void, enqueue, (Callback &&), (override));

    MOCK_METHOD(void, processEvents, (), (override));
};
} // namespace test