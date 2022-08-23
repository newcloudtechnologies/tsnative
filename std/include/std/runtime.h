#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <vector>
#include <memory>

TS_CODE("import { GC } from './gc' \n");
TS_CODE("import { Diagnostics } from './diagnostics' \n");

class GC;
class Diagnostics;

template<typename T>
class Array;

class String;
class Allocator;
class MemoryDiagnosticsStorage;
class IGCImpl;

class TS_EXPORT TS_DECLARE Runtime final : public Object
{
public:
    static int init(int argc, char* argv[]);
    static void destroy();
    static bool isInitialized();

    static TS_METHOD GC* getGC();

    static TS_METHOD Diagnostics* getDiagnostics();

    static TS_METHOD Array<String*>* getCmdArgs();

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

    static Allocator* getAllocator();

private:
    Runtime() = delete;

    static void checkInitialization();
    static void initCmdArgs(int ac, char* av[]);

    static std::vector<std::string> _cmdArgs;
    static bool _isInitialized;

    static std::unique_ptr<MemoryDiagnosticsStorage> _memoryDiagnosticsStorage;
    static std::unique_ptr<IGCImpl> _gcImpl;
    static std::unique_ptr<Allocator> _allocator;
};
