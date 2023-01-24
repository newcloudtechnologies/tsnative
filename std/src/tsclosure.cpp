/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "std/tsclosure.h"

#include "std/tsnumber.h"
#include "std/tsstring.h"

#include "std/private/logger.h"
#include "std/private/to_string_impl.h"

TSClosure::TSClosure(void* fn, void*** env, Number* envLength, Number* numArgs, Number* optionals)
    : Object(TSTypeID::Closure)
    , _fn(fn)
    , _env(env)
    , _envLength(envLength)
    , _numArgs(numArgs)
    , _optionals(static_cast<int64_t>(optionals->unboxed()))
{
    LOG_ADDRESS("Calling closure ctor ", this);
    LOG_ADDRESS("Env address: ", env);

    const auto nArgs = static_cast<std::size_t>(numArgs->unboxed());
    const auto envLen = static_cast<std::size_t>(envLength->unboxed());

    for (std::size_t i = 0; i < nArgs; ++i)
    {
        LOG_ADDRESS("Arg void** ", _env[i]);
    }

    for (std::size_t i = nArgs; i < envLen; ++i)
    {
        LOG_ADDRESS("Captured void** ", _env[i]);
    }
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

Number* TSClosure::getNumArgs() const
{
    return _numArgs;
}

void* TSClosure::operator()() const
{
    return reinterpret_cast<void* (*)(void***)>(_fn)(_env);
}

void* TSClosure::call() const
{
    return operator()();
}

std::string TSClosure::toStdString() const
{
    return "[Function]";
}

DEFAULT_TO_STRING_IMPL(TSClosure)

std::vector<Object*> TSClosure::getChildObjects() const
{
    auto result = Object::getChildObjects();

    if (_numArgs)
    {
        result.push_back(_numArgs);
    }

    if (_envLength)
    {
        result.push_back(_envLength);
    }

    const auto envLength = static_cast<std::size_t>(_envLength->unboxed());
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