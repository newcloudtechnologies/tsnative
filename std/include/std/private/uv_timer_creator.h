#pragma once

#include "std/id_generator.h"
#include "std/itimer_creator.h"

#include <cstddef>

class UVLoopAdapter;

class UVTimerCreator : public ITimerCreator
{
public:
    UVTimerCreator(const UVLoopAdapter& uvLoop);

    TimerObject* create(TSClosure* closure) const override;

private:
    static ID generateTimerId();

private:
    const UVLoopAdapter& _uvLoop;
};
