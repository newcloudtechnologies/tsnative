#include "std/runtime.h"

#include "std/gc.h"
#include "std/tsstring.h"
#include "std/tsarray.h"

bool Runtime::_isInitialized = false;
std::vector<std::string> Runtime::_cmdArgs{};

void Runtime::checkInitialization()
{
    if (!_isInitialized) 
    {
        throw std::runtime_error("Runtime was already initialized");
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

    auto result = GC::track(new Array<String*>{});
    for (const auto& s : _cmdArgs)
    {
        auto nextArg = GC::track(new String{s});
        result->push(nextArg);
    }

    return result;
}

void Runtime::init(int ac, char* av[])
{
    if (_isInitialized) 
    {
        throw std::runtime_error("Runtime was already initialized");
    }

    initCmdArgs(ac, av);
    _isInitialized = true;
}

void Runtime::destroy()
{
    checkInitialization();

    _cmdArgs.clear();
    _isInitialized = false;
}

String* Runtime::toString() const
{
    checkInitialization();
    
    auto header = GC::track(new String{"GlobalRuntimeObject:"});
    auto separator = GC::track(new String{"\n"});
    auto cmdArgsHeader = GC::track(new String{"CmdArgs:"});
    auto cmdArgsStr = getCmdArgs()->toString();

    return header->concat(separator)
            ->concat(cmdArgsHeader)->concat(separator)
            ->concat(cmdArgsStr)->concat(separator);
}

Boolean* Runtime::toBool() const
{
    return GC::track(new Boolean(_isInitialized));
}