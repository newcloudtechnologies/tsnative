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

#include <chrono>
#include <functional>

class ITimer
{
public:
    using Callback = std::function<void()>;

    virtual ~ITimer() = default;

    virtual bool active() const = 0;

    virtual std::chrono::milliseconds due() const = 0;

    virtual void setInterval(std::chrono::milliseconds repeat, Callback&& callback) = 0;

    virtual void setTimeout(std::chrono::milliseconds timeout, Callback&& callback) = 0;

    virtual std::chrono::milliseconds getRepeat() const = 0;

    virtual void stop() = 0;

    virtual std::size_t getTimerID() const = 0;
};