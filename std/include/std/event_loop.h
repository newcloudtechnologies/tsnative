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

#include <TS.h>

#include "std/private/ievent_loop.h"
#include "std/tsobject.h"

#include <memory>

class ITimer;
class Number;

class TS_EXPORT TS_DECLARE EventLoop : public Object
{
public:
    EventLoop(IEventLoop& eventLoop);

    ~EventLoop();

    TS_METHOD Number* run(Boolean* lock);

    void stop();

    void processEvents();

    void enqueue(IEventLoop::Callback&& callback);

    TS_METHOD String* toString() const override;

    TS_METHOD Boolean* toBool() const override;

private:
    IEventLoop& _eventLoop;
};
