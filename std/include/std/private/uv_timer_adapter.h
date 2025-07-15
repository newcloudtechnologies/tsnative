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
