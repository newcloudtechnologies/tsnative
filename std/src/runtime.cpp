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

#include "std/runtime.h"

#include "std/event_loop.h"
#include "std/tsarray.h"
#include "std/tsstring.h"

#include "std/private/default_executor.h"
#include "std/private/logger.h"
#include "std/private/memory_management/mem_manager_creator.h"
#include "std/private/memory_management/memory_manager.h"
#include "std/private/uv_loop_adapter.h"
#include "std/private/uv_timer_creator.h"

#include <cassert>
#include <cstdlib>

bool Runtime::_isInitialized = false;
std::vector<std::string> Runtime::_cmdArgs{};
std::unique_ptr<IEventLoop> Runtime::_loop{nullptr};
std::unique_ptr<IExecutor> Runtime::_executor{nullptr};
std::unique_ptr<ITimerCreator> Runtime::_timerCreator{nullptr};
std::unique_ptr<MemoryManager> Runtime::_memoryManager{nullptr};
TimerStorage Runtime::_timers{};

namespace
{
void exitHandler()
{
    Runtime::destroy();
}

int registerExitHandlers()
{
    int result = std::atexit(exitHandler);
    if (result != 0)
    {
        LOG_ERROR("Registration atexit handler failed");
        return result;
    }

    // TODO There can be a quick exit like this: std::at_quick_exit
    // But it is not supported by all our agents
    // So we need to check if std::at_quick_exit exists and call it if it does.

    // result = std::at_quick_exit(exit_handler);
    // if (result != 0)
    // {
    //     LOG_ERROR("Registration at_quick_exit handler failed");
    //     return result;
    // }

    return result;
}
} // namespace

void Runtime::checkInitialization()
{
    if (!_isInitialized)
    {
        throw std::runtime_error("Runtime was not initialized");
    }
}

void Runtime::initCmdArgs(int ac, char* av[])
{
    if (_isInitialized)
    {
        throw std::runtime_error("Runtime was already initialized");
    }

    _cmdArgs.reserve(ac);
    for (int i = 0; i < ac; ++i)
    {
        _cmdArgs.emplace_back(av[i]);
    }
}

bool Runtime::isInitialized()
{
    return _isInitialized;
}

void Runtime::initLoop(IEventLoop* customEventLoop)
{
    if (customEventLoop)
    {
        _loop.reset(customEventLoop);
    }
    else
    {
        _loop = std::make_unique<UVLoopAdapter>();
    }
}

void Runtime::initTimerCreator(ITimerCreator* customTimerCreator)
{
    if (customTimerCreator)
    {
        _timerCreator.reset(customTimerCreator);
        return;
    }
    assert(_loop);

    _timerCreator = std::make_unique<UVTimerCreator>(*static_cast<UVLoopAdapter*>(_loop.get()));
}

TimerStorage& Runtime::getMutableTimerStorage()
{
    checkInitialization();
    return _timers;
}

const TimerStorage& Runtime::getTimerStorage()
{
    checkInitialization();
    return _timers;
}

MemoryManager* Runtime::getMemoryManager()
{
    checkInitialization();
    return _memoryManager.get();
}

MemoryDiagnostics* Runtime::getMemoryDiagnostics()
{
    checkInitialization();
    return _memoryManager->getMemoryDiagnostics();
}

Array<String*>* Runtime::getCmdArgs()
{
    checkInitialization();

    auto result = new Array<String*>{};
    for (const auto& s : _cmdArgs)
    {
        auto nextArg = new String{s};
        result->push(nextArg);
    }

    return result;
}

int Runtime::init(int ac, char* av[], IEventLoop* customEventLoop, ITimerCreator* customTimerCreator)
{
    if (_isInitialized)
    {
        throw std::runtime_error("Runtime has been initialized already");
    }

    initLoop(customEventLoop);
    initTimerCreator(customTimerCreator);
    initCmdArgs(ac, av);

    _memoryManager = createMemoryManager(_timers, _loop.get());

    const auto result = registerExitHandlers();

    // Leave runtime uninitialized if something is wrong about exit handlers
    if (result != 0)
    {
        return result;
    }
    _isInitialized = true;

    LOG_INFO("Runtime initialized");

    return result;
}

GC* Runtime::getGC()
{
    checkInitialization();
    return getMemoryManager()->getGC();
}

EventLoop* Runtime::getLoop()
{
    checkInitialization();
    return new EventLoop{*_loop};
}

ITimerCreator& Runtime::getTimerCreator()
{
    checkInitialization();
    return *_timerCreator;
}

void Runtime::destroy()
{
    if (!_isInitialized)
    {
        return;
    }

    LOG_INFO("Calling destroy");

    _isInitialized = false;

    _cmdArgs.clear();
    _timerCreator = nullptr;
    _loop = nullptr;
    _memoryManager = nullptr;

    LOG_INFO("Runtime destroy finished");
}

String* Runtime::toString() const
{
    return new String("GlobalRuntimeObject");
}

Boolean* Runtime::toBool() const
{
    return new Boolean(_isInitialized);
}

IExecutor& Runtime::getExecutor()
{
    if (!_executor)
    {
        _executor = std::make_unique<DefaultExecutor>(*_loop);
    }
    return *_executor;
}
