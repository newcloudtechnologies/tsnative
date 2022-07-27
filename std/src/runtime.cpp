#include "std/runtime.h"

#include "std/gc.h"
#include "std/tsstring.h"
#include "std/tsarray.h"
#include "std/memory_diagnostics.h"
#include "std/diagnostics.h"

#include "std/private/default_gc.h"
#include "std/private/allocator.h"
#include "std/private/memory_diagnostics_storage.h"
#include "std/private/logger.h"

#include <cstdlib>

bool Runtime::_isInitialized = false;
std::vector<std::string> Runtime::_cmdArgs{};
std::unique_ptr<GC> Runtime::_gc{nullptr};
std::unique_ptr<Diagnostics> Runtime::_diagnostics{nullptr};

namespace 
{
void exit_handler()
{
    Runtime::destroy();
}

int register_exit_handlers()
{
    int result = std::atexit(exit_handler);
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
}


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
    for (int i = 0 ; i < ac ; ++i)
    {
        _cmdArgs.emplace_back(av[i]);
    }
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
    return _gc.get();
}

void Runtime::setGC(std::unique_ptr<GC> newGC)
{
    if (_gc)
    {
        _gc->collect();
    }
    
    _gc = std::move(newGC);
}

int Runtime::init(int ac, char* av[])
{
    if (_isInitialized) 
    {
        throw std::runtime_error("Runtime was already initialized");
    }

    auto memoryDiagnosticsStorage = std::make_unique<MemoryDiagnosticsStorage>();

    DefaultGC::Callbacks gcCallbacks;
    gcCallbacks.afterDeleted = [memStorage = memoryDiagnosticsStorage.get()](const void* o) 
    { 
        memStorage->onDeleted(o);
    };
    auto defaultGC = std::make_unique<DefaultGC>(std::move(gcCallbacks));

    auto memoryDiagnostics = std::make_unique<MemoryDiagnostics>(std::move(memoryDiagnosticsStorage), *defaultGC);
    _diagnostics = std::make_unique<Diagnostics>(std::move(memoryDiagnostics));
    
    Allocator::Callbacks allocatorCallbacks;
    allocatorCallbacks.onObjectAllocated = [gc = defaultGC.get()] (Object* o)
    {
        gc->addObject(o);
    };

    allocatorCallbacks.beforeMemoryDeallocated = [gc = defaultGC.get()] (void* m)
    {
        gc->untrackIfObject(m);
    };

    auto allocator = std::make_unique<Allocator>(std::move(allocatorCallbacks));

    _gc = std::make_unique<GC>(std::move(defaultGC), std::move(allocator));

    initCmdArgs(ac, av);

    _isInitialized = true;

    LOG_INFO("Runtime initialized");

    return register_exit_handlers();
}

Diagnostics* Runtime::getDiagnostics()
{
    return _diagnostics.get();
}

void Runtime::destroy()
{
    if (!_isInitialized)
    {
        return;
    }

    LOG_INFO("Calling destroy");

    _cmdArgs.clear();

    _gc = nullptr;
    
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
    auto diagnosticsHeader = new String("Diagnostics:");
    auto diagnostics = _diagnostics->toString(); // Should contain info about all subsystems

    return header->concat(separator)
            ->concat(cmdArgsHeader)->concat(separator)
            ->concat(cmdArgsStr)->concat(separator)
            ->concat(diagnosticsHeader)->concat(separator)
            ->concat(diagnostics)->concat(separator);
}

Boolean* Runtime::toBool() const
{
    return new Boolean(_isInitialized);
}