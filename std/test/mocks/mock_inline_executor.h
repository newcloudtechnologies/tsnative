#pragma once

#include <gmock/gmock.h>

#include "std/ievent_loop.h"
#include "std/private/iexecutor.h"

namespace test
{

class MockInlineExecutor : public IExecutor
{
public:
    MOCK_METHOD(void, enqueue, (Callback &&), (const, noexcept, override));
};

class InlineExecutor : public IExecutor
{
public:
    explicit InlineExecutor() = default;

    ~InlineExecutor() override = default;

    void enqueue(Callback&& callback) const noexcept override;
};

} // namespace test