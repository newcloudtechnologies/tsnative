#include "std/tsclosure.h"

#include "std/gc.h"
#include "std/tsnumber.h"
#include "std/tsstring.h"

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

void* TSClosure::operator()() const
{
    return reinterpret_cast<void* (*)(void**)>(fn)(env);
}

void* TSClosure::call() const
{
    return operator()();
}

String* TSClosure::toString() const
{
    return GC::track(new String("[Function]"));
}
