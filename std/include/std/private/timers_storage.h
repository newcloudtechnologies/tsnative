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

#include "registry.h"

class IEventLoop;

class TimersStorage
{
public:
    TimersStorage(IEventLoop& eventLoop);
    ITimer* createTimer();

    void removeTimerById(std::size_t timerId);

private:
    std::size_t generateTimerId();

private:
    const IEventLoop& _eventLoop;
    TimerFactoryFunctionsRegistry<std::size_t> _registry;
    std::size_t _registryKey{0};
    std::unordered_map<std::size_t, std::unique_ptr<ITimer>> _timers;
};
