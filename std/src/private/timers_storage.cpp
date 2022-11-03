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

#include "std/private/timers_storage.h"
#include "std/private/ievent_loop.h"
#include "std/private/logger.h"
#include "std/private/uv_loop_adapter.h"

TimersStorage::TimersStorage(IEventLoop& eventLoop)
    : _eventLoop{eventLoop}
{
    LOG_METHOD_CALL;
    _registry.registerFactory(_registryKey,
                              [this]
                              {
                                  static_assert(std::is_base_of<IEventLoop, UVLoopAdapter>::value,
                                                "UVLoopAdapter should be IEventLoop type");
                                  const auto& uvLoop = static_cast<const UVLoopAdapter&>(_eventLoop);
                                  return std::make_unique<UVTimerAdapter>(uvLoop, generateTimerId());
                              });
}

ITimer* TimersStorage::createTimer()
{
    LOG_METHOD_CALL;
    auto timer = _registry.construct(_registryKey);
    auto id = timer->getTimerID();
    _timers[id] = std::move(timer);
    return _timers[id].get();
}

void TimersStorage::removeTimerById(std::size_t timerId)
{
    LOG_METHOD_CALL;
    if (_timers.count(timerId))
    {
        _timers[timerId]->stop();
        _timers.erase(timerId);
    }
}

std::size_t TimersStorage::generateTimerId()
{
    static std::size_t currentTimer{0};
    return ++currentTimer;
}