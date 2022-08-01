#include "std/tsundefined.h"
#include "std/tsboolean.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

Undefined::Undefined()
{
    LOG_ADDRESS("Calling Undefined ctor ", this);
}

String* Undefined::toString() const
{
    return new String("undefined");
}

Boolean* Undefined::toBool() const
{
    return new Boolean(false);
}
