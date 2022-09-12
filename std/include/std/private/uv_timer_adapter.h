#pragma once

#include "itimer.h"
#include "libuv_wrapper/timer_event_handler.h"

class UVLoopAdapter;

class UVTimerAdapter : public ITimer
{
public:
    explicit UVTimerAdapter(const UVLoopAdapter & uvLoopAdapter, std::size_t timerID);

    UVTimerAdapter() = delete;

    UVTimerAdapter(const UVTimerAdapter &) = delete;

    UVTimerAdapter &operator=(const UVTimerAdapter &) = delete;

    ~UVTimerAdapter() override;

    bool active() const override;

    std::chrono::milliseconds due() const override;

    void setInterval(std::chrono::milliseconds repeat, Callback && callback) override;

    void setTimeout(std::chrono::milliseconds timeout, Callback && callback) override;

    std::chrono::milliseconds getRepeat() const override;

    void stop() override;

    std::size_t getTimerID() const override;

private:
    std::shared_ptr<uv::TimerEventHandler> _timerHandler;
    std::size_t _timerID;
};
