/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
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