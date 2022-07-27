#include "std/tsundefined.h"
#include "std/tsboolean.h"
#include "std/tsstring.h"

Undefined::Undefined()
{
}

String* Undefined::toString() const
{
    return new String("undefined");
}

Boolean* Undefined::toBool() const
{
    return new Boolean(false);
}
