#include "std/tsclosure.h"

TSClosure::TSClosure(void* fn, void** env, Number* numArgs, Number* optionals)
    : fn(fn)
    , env(env)
    , numArgs(numArgs)
    , optionals(static_cast<int64_t>(optionals->unboxed()))
{
}

void** TSClosure::getEnvironment() const
{
    return env;
}

Number* TSClosure::getNumArgs() const
{
    return numArgs;
}

void* TSClosure::operator()()
{
    return reinterpret_cast<void* (*)(void**)>(fn)(env);
}