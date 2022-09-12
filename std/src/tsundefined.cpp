#include "std/tsundefined.h"
#include "std/tsboolean.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

static Undefined* g_instance = nullptr;

Undefined::Undefined()
{
    _typeid = TypeID::Undefined;

    LOG_ADDRESS("Calling Undefined ctor ", this);
}

Undefined* Undefined::instance()
{
    if (!g_instance) {
        g_instance = new Undefined();
    }

    return g_instance;
}

String* Undefined::toString() const
{
    return new String("undefined");
}

Boolean* Undefined::toBool() const
{
    return new Boolean(false);
}
