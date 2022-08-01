#include "std/tsclosure.h"

#include "std/tsnumber.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

TSClosure::TSClosure(void* fn, void** env, Number* numArgs, Number* optionals)
    : fn(fn)
    , env(env)
    , numArgs(numArgs)
    , optionals(static_cast<int64_t>(optionals->unboxed()))
{
    LOG_ADDRESS("Calling closure ctor ", this);
    LOG_ADDRESS("Env address: ", env);
}

// TODO Should TSClosure remove it's env and how?

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
    return new String("[Function]");
}

void TSClosure::markChildren()
{
    if (numArgs && !numArgs->isMarked())
    {
        numArgs->mark();
    }

    const auto argsCount = static_cast<std::size_t>(this->numArgs->unboxed());
    for (std::size_t i = 0 ; i < argsCount ; ++i)
    {
        auto* o = static_cast<Object*>(env[i]);
        if (o && !o->isMarked())
        {
            o->mark();
        }
    }
}