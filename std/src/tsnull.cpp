#include "std/tsnull.h"

#include "std/tsboolean.h"
#include "std/tsstring.h"

Null::Null()
{
}

String* Null::toString() const
{
    return new String("null");
}

Boolean* Null::toBool() const
{
    return new Boolean(false);
}
