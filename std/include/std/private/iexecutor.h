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

#include <functional>

class IExecutor
{
public:
    using Callback = std::function<void()>;

    virtual ~IExecutor() = default;

    virtual void enqueue(Callback&& callback) const noexcept = 0;
};
