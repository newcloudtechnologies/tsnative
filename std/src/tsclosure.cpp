#include "std/tsclosure.h"

#include "std/tsnumber.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

TSClosure::TSClosure(void* fn, void** env, Number* envLength, Number* numArgs, Number* optionals)
    : _fn(fn)
    , _env(env)
    , _envLength(envLength)
    , _numArgs(numArgs)
    , _optionals(static_cast<int64_t>(optionals->unboxed()))
{
    LOG_ADDRESS("Calling closure ctor ", this);
    LOG_ADDRESS("Env address: ", env);
}

// TODO Should TSClosure remove it's env and how?

void** TSClosure::getEnvironment() const
{
    return _env;
}

Number* TSClosure::getNumArgs() const
{
    return _numArgs;
}

void* TSClosure::operator()() const
{
    return reinterpret_cast<void* (*)(void**)>(_fn)(_env);
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
    if (_numArgs && !_numArgs->isMarked())
    {
        _numArgs->mark();
    }

    if (_envLength && !_envLength->isMarked())
    {
        _envLength->mark();
    }

    const auto argsCount = static_cast<std::size_t>(_envLength->unboxed());
    for (std::size_t i = 0 ; i < argsCount ; ++i)
    {
        auto* o = static_cast<Object*>(_env[i]);
        if (o && !o->isMarked())
        {
            o->mark();
        }
    }
}