#include "std/tsnull.h"

#include "std/tsboolean.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

static Null* g_instance = nullptr;

Null::Null()
{
    LOG_ADDRESS("Calling Null ctor ", this);
}

Null* Null::instance()
{
    if (!g_instance) {
        g_instance = new Null();
    }

    return g_instance;
}

String* Null::toString() const
{
    return new String("null");
}

Boolean* Null::toBool() const
{
    return new Boolean(false);
}
