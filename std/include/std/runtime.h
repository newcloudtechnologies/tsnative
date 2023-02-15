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

#include <TS.h>

#include "std/tsobject.h"

#include <memory>
#include <vector>

#include "std/private/async_object_storage.h"

TS_CODE("import { GC } from './gc' \n");
TS_CODE("import { Diagnostics } from './diagnostics' \n");
TS_CODE("import { EventLoop } from './event_loop' \n");

class GC;
class Diagnostics;

template <typename T>
class Array;

class String;
class Allocator;
class MemoryDiagnosticsStorage;
class IGCImpl;

class EventLoop;

class IEventLoop;

class IExecutor;
class ITimerCreator;

class TS_EXPORT TS_DECLARE Runtime final : public Object
{
public:
    static int init(int argc,
                    char* argv[],
                    IEventLoop* customEventLoop = nullptr,
                    ITimerCreator* customTimerCreator = nullptr);
    static void destroy();
    static bool isInitialized();

    static TS_METHOD GC* getGC();

    static TS_METHOD Diagnostics* getDiagnostics();

    static TS_METHOD EventLoop* getLoop();

    static IExecutor& getExecutor();

    static ITimerCreator& getTimerCreator();

    static TS_METHOD Array<String*>* getCmdArgs();

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

    static Allocator& getAllocator();

    static TimerStorage& getMutableTimerStorage();
    static const TimerStorage& getTimerStorage();

    static PromiseStorage& getMutablePromiseStorage();
    static const PromiseStorage& getPromiseStorage();

private:
    Runtime() = delete;

    static void checkInitialization();
    static void initCmdArgs(int ac, char* av[]);
    static void initLoop(IEventLoop* customEventLoop);
    static void initTimerCreator(ITimerCreator* timerCreator);

    static std::vector<std::string> _cmdArgs;
    static std::unique_ptr<IEventLoop> _loop;
    static bool _isInitialized;

    static std::unique_ptr<MemoryDiagnosticsStorage> _memoryDiagnosticsStorage;
    static std::unique_ptr<IGCImpl> _gcImpl;
    static std::unique_ptr<Allocator> _allocator;

    static std::unique_ptr<IExecutor> _executor;
    static std::unique_ptr<ITimerCreator> _timerCreator;

    static TimerStorage _timers;
    static PromiseStorage _promises;
};
