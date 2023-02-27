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