#pragma once

#include <TS.h>

#include "std/tsobject.h"
#include "std/private/timers_storage.h"

#include <vector>
#include <memory>

TS_CODE("import { GC } from './gc' \n");
TS_CODE("import { Diagnostics } from './diagnostics' \n");
TS_CODE("import { EventLoop } from './event_loop' \n");

class GC;
class Diagnostics;

template<typename T>
class Array;

class String;
class Allocator;
class MemoryDiagnosticsStorage;
class IGCImpl;

class EventLoop;

class IEventLoop;

class ITimer;

class TS_EXPORT TS_DECLARE Runtime final : public Object
{
public:

    using Timers = TimersStorage;

    static int init(int argc, char* argv[]);
    static void destroy();
    static bool isInitialized();

    static TS_METHOD GC* getGC();

    static TS_METHOD Diagnostics* getDiagnostics();

    static TS_METHOD EventLoop * getLoop();

    static Timers * getTimersStorage();

    static TS_METHOD Array<String*>* getCmdArgs();

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

    static Allocator* getAllocator();

private:
    Runtime() = delete;

    static void checkInitialization();
    static void initCmdArgs(int ac, char* av[]);
    static void initLoop();
    static void initTimersStorage();

    static std::vector<std::string> _cmdArgs;
    static std::unique_ptr<IEventLoop> _loop;
    static bool _isInitialized;

    static std::unique_ptr<MemoryDiagnosticsStorage> _memoryDiagnosticsStorage;
    static std::unique_ptr<IGCImpl> _gcImpl;
    static std::unique_ptr<Allocator> _allocator;

    static std::unique_ptr<Timers> _timersStorage;
};
