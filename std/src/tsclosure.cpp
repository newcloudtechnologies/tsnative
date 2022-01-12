#include "std/tsclosure.h"

TSClosure::TSClosure(void* fn, void** env, TSNumber numArgs, TSNumber optionals)
    : fn(fn)
    , env(env)
    , numArgs(static_cast<int>(numArgs))
    , optionals(static_cast<int64_t>(optionals))
{
}

void** TSClosure::getEnvironment() const
{
    return env;
}

TSNumber TSClosure::getNumArgs() const
{
    return static_cast<TSNumber>(numArgs);
}

void* TSClosure::operator()()
{
    return reinterpret_cast<void* (*)(void**)>(fn)(env);
}