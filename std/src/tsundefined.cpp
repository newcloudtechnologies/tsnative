#include "std/tsundefined.h"

#include "std/gc.h"
#include "std/tsboolean.h"
#include "std/tsstring.h"

Undefined::Undefined()
{
}

String* Undefined::toString() const
{
    return GC::track(new String("undefined"));
}

Boolean* Undefined::toBool() const
{
    return GC::track(new Boolean(false));
}
