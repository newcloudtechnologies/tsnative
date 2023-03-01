/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "std/private/tslazy_closure.h"

#include "std/private/logger.h"
#include "std/tsstring.h"

TSLazyClosure::TSLazyClosure(Enviroment env)
    : Object(TSTypeID::LazyClosure)
    , _env(env)
{
    LOG_ADDRESS("Calling lazy closure ctor ", this);
    LOG_ADDRESS("Env address: ", env);
}

TSLazyClosure::~TSLazyClosure()
{
    LOG_ADDRESS("Calling lazy closure dtor ", this);
    LOG_ADDRESS("Freeing env ", _env);
    free(_env);
}

TSLazyClosure::Enviroment TSLazyClosure::getEnvironment()
{
    return _env;
}

String* TSLazyClosure::toString() const
{
    return new String("[Function]");
}