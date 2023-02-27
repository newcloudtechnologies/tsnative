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

#include "std/timer_object.h"

#include "libuv_wrapper/timer_event_handler.h"

class UVLoopAdapter;
class TSClosure;

class UVTimerAdapter : public TimerObject
{
public:
    explicit UVTimerAdapter(const UVLoopAdapter& uvLoopAdapter, TSClosure* closure, ID timerID);

    UVTimerAdapter() = delete;

    UVTimerAdapter(const UVTimerAdapter&) = delete;

    UVTimerAdapter& operator=(const UVTimerAdapter&) = delete;

    ~UVTimerAdapter() override;

    bool active() const override;

    std::chrono::milliseconds due() const override;

    void setInterval(std::chrono::milliseconds repeat) override;

    void setTimeout(std::chrono::milliseconds timeout) override;

    std::chrono::milliseconds getRepeat() const override;

    void stop() override;

    ID getID() const override;

private:
    std::shared_ptr<uv::TimerEventHandler> _timerHandler;
    ID _timerID;
};
