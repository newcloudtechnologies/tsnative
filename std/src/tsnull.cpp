#include "std/tsnull.h"

#include "std/tsboolean.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

Null::Null()
{
    LOG_ADDRESS("Calling Null ctor ", this);
}

String* Null::toString() const
{
    return new String("null");
}

Boolean* Null::toBool() const
{
    return new Boolean(false);
}
