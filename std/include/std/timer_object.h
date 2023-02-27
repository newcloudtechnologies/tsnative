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

#include <chrono>
#include <functional>

#include "std/id_generator.h"
#include "std/tsobject.h"

class TSClosure;

class TimerObject : public Object
{
public:
    using Callback = std::function<void()>;

    explicit TimerObject(TSClosure* closure);

    virtual ~TimerObject() = default;

    virtual bool active() const = 0;

    virtual std::chrono::milliseconds due() const = 0;

    virtual void setInterval(std::chrono::milliseconds repeat) = 0;

    virtual void setTimeout(std::chrono::milliseconds timeout) = 0;

    virtual std::chrono::milliseconds getRepeat() const = 0;

    virtual void stop() = 0;

    virtual ID getID() const = 0;

    std::vector<Object*> getChildObjects() const;

    const TSClosure& getClosure() const;

private:
    TSClosure* _closure;
};