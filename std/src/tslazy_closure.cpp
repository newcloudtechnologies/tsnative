#include "std/tslazy_closure.h"

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