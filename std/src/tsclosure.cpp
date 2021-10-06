#include "std/tsclosure.h"

TSClosure::TSClosure(void* fn, void** env, int numArgs)
    : fn(fn)
    , env(env)
    , numArgs(numArgs)
{
}

void** TSClosure::getEnvironment() const
{
    return env;
}

int TSClosure::getNumArgs() const
{
    return numArgs;
}

void* TSClosure::operator()()
{
    return reinterpret_cast<void* (*)(void**)>(fn)(env);
}