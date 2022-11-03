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

#include "std/runtime.h"

#include "std/diagnostics.h"
#include "std/gc.h"
#include "std/memory_diagnostics.h"
#include "std/tsarray.h"
#include "std/tsstring.h"

#include "std/event_loop.h"
#include "std/private/allocator.h"
#include "std/private/default_gc.h"
#include "std/private/logger.h"
#include "std/private/memory_diagnostics_storage.h"
#include "std/private/uv_loop_adapter.h"

#include <cstdlib>

bool Runtime::_isInitialized = false;
std::vector<std::string> Runtime::_cmdArgs{};
std::unique_ptr<IGCImpl> Runtime::_gcImpl{nullptr};
std::unique_ptr<Allocator> Runtime::_allocator{nullptr};
std::unique_ptr<MemoryDiagnosticsStorage> Runtime::_memoryDiagnosticsStorage{nullptr};
std::unique_ptr<IEventLoop> Runtime::_loop{nullptr};
std::unique_ptr<Runtime::Timers> Runtime::_timersStorage{nullptr};

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

Allocator* Runtime::getAllocator()
{
    checkInitialization();
    return _allocator.get();
}
void Runtime::initLoop()
{
    _loop = std::make_unique<UVLoopAdapter>();
}

void Runtime::initTimersStorage()
{
    _timersStorage = std::make_unique<Timers>(*(_loop.get()));
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

GC* Runtime::getGC()
{
    checkInitialization();

    return new GC{_gcImpl.get(), _allocator.get()};
}

int Runtime::init(int ac, char* av[])
{
    if (_isInitialized)
    {
        throw std::runtime_error("Runtime has been initialized already");
    }

    _memoryDiagnosticsStorage = std::make_unique<MemoryDiagnosticsStorage>();

    DefaultGC::Callbacks gcCallbacks;
    gcCallbacks.afterDeleted = [memStorage = _memoryDiagnosticsStorage.get()](const void* o)
    { memStorage->onDeleted(o); };
    auto defaultGC = std::make_unique<DefaultGC>(std::move(gcCallbacks));

    Allocator::Callbacks allocatorCallbacks;
    allocatorCallbacks.onObjectAllocated = [gc = defaultGC.get()](Object* o) { gc->addObject(o); };

    allocatorCallbacks.beforeMemoryDeallocated = [gc = defaultGC.get()](void* m) { gc->untrackIfObject(m); };

    _gcImpl = std::move(defaultGC);
    _allocator = std::make_unique<Allocator>(std::move(allocatorCallbacks));

    initCmdArgs(ac, av);

    const auto result = registerExitHandlers();

    // Leave runtime uninitialized if something is wrong about exit handlers
    if (result != 0)
    {
        return result;
    }

    initLoop();
    initTimersStorage();
    _isInitialized = true;

    LOG_INFO("Runtime initialized");

    return result;
}

Diagnostics* Runtime::getDiagnostics()
{
    checkInitialization();

    return new Diagnostics{*_gcImpl, *_memoryDiagnosticsStorage};
}

EventLoop* Runtime::getLoop()
{
    checkInitialization();
    return new EventLoop{*(_loop.get())};
}

Runtime::Timers* Runtime::getTimersStorage()
{
    checkInitialization();
    return _timersStorage.get();
}

void Runtime::destroy()
{
    if (!_isInitialized)
    {
        return;
    }

    LOG_INFO("Calling destroy");

    _cmdArgs.clear();
    _timersStorage = nullptr;
    _loop = nullptr;
    _gcImpl = nullptr;

    _isInitialized = false;

    LOG_INFO("Runtime destroy finished");
}

String* Runtime::toString() const
{
    checkInitialization();

    auto header = new String{"GlobalRuntimeObject:"};
    auto separator = new String{"\n"};
    auto cmdArgsHeader = new String{"CmdArgs:"};
    auto cmdArgsStr = getCmdArgs()->toString();

    return header->concat(separator)->concat(cmdArgsHeader)->concat(separator)->concat(cmdArgsStr)->concat(separator);
}

Boolean* Runtime::toBool() const
{
    return new Boolean(_isInitialized);
}