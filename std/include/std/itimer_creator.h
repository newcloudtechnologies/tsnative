#pragma once

class TimerObject;
class TSClosure;

class ITimerCreator
{
public:
    virtual ~ITimerCreator() = default;

    virtual TimerObject* create(TSClosure* closure) const = 0;
};
