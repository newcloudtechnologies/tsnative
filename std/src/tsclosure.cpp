#include "std/tsclosure.h"

#include "std/tsnumber.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

TSClosure::TSClosure(void* fn, void*** env, Number* envLength, Number* numArgs, Number* optionals)
    : Object(TSTypeID::Closure)
    , _fn{reinterpret_cast<void* (*)(void***)>(fn)}
    , _env(env)
    , _envLength(envLength->unboxed())
    , _numArgs(numArgs->unboxed())
    , _optionals(optionals->unboxed())
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Calling closure ctor ", this);
}

TSClosure::TSClosure(FunctionToCall&& fn, void*** env, std::uint32_t envLength, std::uint32_t numArgs)
    : Object(TSTypeID::Closure)
    , _fn{std::move(fn)}
    , _env{env}
    , _envLength{envLength}
    , _numArgs{numArgs}
    , _optionals{0}
{
    LOG_METHOD_CALL;
    LOG_ADDRESS("Calling closure ctor ", this);
}

TSClosure::~TSClosure()
{
    LOG_ADDRESS("Calling closure dtor ", this);
    LOG_ADDRESS("Freeing env ", _env);
    free(_env);
}

void*** TSClosure::getEnvironment() const
{
    return _env;
}

std::uint32_t TSClosure::getNumArgs() const
{
    return _numArgs;
}

std::uint32_t TSClosure::getEnvironmentLength() const
{
    return _envLength;
}

void* TSClosure::call() const
{
    return _fn(_env);
}

String* TSClosure::toString() const
{
    return new String("[Function]");
}

std::vector<Object*> TSClosure::getChildObjects() const
{
    auto result = Object::getChildObjects();

    const auto envLength = _envLength;
    for (std::size_t i = 0; i < envLength; ++i)
    {
        auto voidStarStar = _env[i];
        auto* o = static_cast<Object*>(*voidStarStar);
        if (o)
        {
            result.push_back(o);
        }
    }

    return result;
}