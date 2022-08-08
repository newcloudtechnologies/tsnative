#include "std/tsclosure.h"

#include "std/tsnumber.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

TSClosure::TSClosure(void* fn, void** env, Number* envLength, Number* numArgs, Number* optionals)
    : fn(fn)
    , env(env)
    , envLength(envLength)
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

std::vector<Object*> TSClosure::getChildren() const
{
    const auto envLen = static_cast<std::size_t>(this->envLength->unboxed());

    std::vector<Object*> result{numArgs, envLength};
    result.reserve(envLen + 2);

    for (std::size_t i = 0 ; i < envLen ; ++i)
    {
        auto* o = static_cast<Object*>(env[i]);
        if (o)
        {
            result.push_back(o);
        }
    }

    return result;
}