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

#include "std/private/memory_management/memory_cleaner.h"

#include "std/ievent_loop.h"
#include "std/private/memory_management/igc_impl.h"

#include "std/private/logger.h"

MemoryCleaner::MemoryCleaner(IEventLoop* loop, IGCImpl* gc)
    : _eventLoop(loop)
    , _gc(gc)
{
}

void MemoryCleaner::asyncClear(const std::function<void()> afterClear)
{
    // TODO scheduling GC clear is temporally disabled
    // see https://jira.ncloudtech.ru:8090/browse/TSN-553
    return;

    if (_collectScheduled)
    {
        LOG_INFO("Garbage collection is already scheduled");
        return;
    }

    _collectScheduled = true;

    LOG_INFO("Scheduling Garbage collection");

    _eventLoop->enqueue(
        [this, fn = afterClear]()
        {
            _gc->collect();
            _collectScheduled = false;
            fn();
        });
}