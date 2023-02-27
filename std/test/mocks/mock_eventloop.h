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

#pragma once

#include <gmock/gmock.h>

#include "std/ievent_loop.h"

namespace test
{

class MockEventLoop final : public IEventLoop
{
public:
    MOCK_METHOD(int, run, (bool), (override));
    MOCK_METHOD(void, stop, (), (override));

    MOCK_METHOD(bool, isRunning, (), (const, override));

    MOCK_METHOD(void, enqueue, (Callback &&), (override));

    MOCK_METHOD(void, processEvents, (), (override));
};
} // namespace test