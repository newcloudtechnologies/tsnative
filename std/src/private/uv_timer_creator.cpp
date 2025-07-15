#include "std/private/uv_timer_creator.h"

#include "std/private/uv_timer_adapter.h"

UVTimerCreator::UVTimerCreator(const UVLoopAdapter& uvLoop)
    : _uvLoop{uvLoop}
{
}

TimerObject* UVTimerCreator::create(TSClosure* closure) const
{
    return new UVTimerAdapter(_uvLoop, closure, generateTimerId());
}

ID UVTimerCreator::generateTimerId()
{
    return IDGenerator{}.createID();
}