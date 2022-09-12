#pragma once

#include "registry.h"

class IEventLoop;

class TimersStorage
{
public:
    TimersStorage(IEventLoop & eventLoop);
    ITimer * createTimer();

    void removeTimerById(std::size_t timerId);

private:
    std::size_t generateTimerId();

private:
    const IEventLoop & _eventLoop;
    TimerFactoryFunctionsRegistry<std::size_t> _registry;
    std::size_t _registryKey{0};
    std::unordered_map<std::size_t, std::unique_ptr<ITimer>> _timers;
};
