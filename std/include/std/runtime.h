#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include "std/private/memory_management/async_object_storage.h"

#include <memory>
#include <vector>

TS_CODE("import { GC } from './gc' \n");
TS_CODE("import { EventLoop } from './event_loop' \n");
TS_CODE("import { MemoryDiagnostics } from './memory_diagnostics' \n");

template <typename T>
class Array;

class String;
class EventLoop;
class MemoryManager;
class GC;
class IEventLoop;
class IExecutor;
class ITimerCreator;
class MemoryDiagnostics;

class TS_EXPORT TS_DECLARE Runtime final : public Object
{
public:
    static int init(int argc,
                    char* argv[],
                    IEventLoop* customEventLoop = nullptr,
                    ITimerCreator* customTimerCreator = nullptr);
    static void destroy();

    static bool isInitialized();

    static TS_METHOD EventLoop* getLoop();

    static MemoryManager* getMemoryManager();

    // TODO remove me from here, to do so need to change the compiler
    static TS_METHOD GC* getGC();

    // TODO remove me from here, to do so need to change the compiler
    static TS_METHOD MemoryDiagnostics* getMemoryDiagnostics();

    static IExecutor& getExecutor();

    static ITimerCreator& getTimerCreator();

    static TimerStorage& getMutableTimerStorage();
    static const TimerStorage& getTimerStorage();

    static TS_METHOD Array<String*>* getCmdArgs();

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

private:
    Runtime() = delete;

    static void checkInitialization();
    static void initCmdArgs(int ac, char* av[]);
    static void initLoop(IEventLoop* customEventLoop);
    static void initTimerCreator(ITimerCreator* timerCreator);

    static std::vector<std::string> _cmdArgs;
    static std::unique_ptr<IEventLoop> _loop;
    static bool _isInitialized;

    // TO DO use roots like promise do instead of using AsyncStorage to keep timers alive
    static TimerStorage _timers;

    static std::unique_ptr<IExecutor> _executor;
    static std::unique_ptr<ITimerCreator> _timerCreator;
    static std::unique_ptr<MemoryManager> _memoryManager;
};
