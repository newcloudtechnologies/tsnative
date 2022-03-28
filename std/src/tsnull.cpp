#include "std/tsnull.h"

#include "std/gc.h"
#include "std/tsboolean.h"
#include "std/tsstring.h"

Null::Null()
{
}

String* Null::toString() const
{
    return GC::track(new String("null"));
}

Boolean* Null::toBool() const
{
    return GC::track(new Boolean(false));
}
