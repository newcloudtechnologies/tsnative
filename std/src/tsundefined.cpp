#include "std/tsundefined.h"
#include "std/tsboolean.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

Undefined::Undefined()
    : Object(TSTypeID::Undefined)
{
    LOG_ADDRESS("Calling Undefined ctor ", this);
}

Undefined* Undefined::instancePtr = nullptr;

Undefined* Undefined::instance()
{
    if (!instancePtr)
    {
        instancePtr = new Undefined{};
    }
    return instancePtr;
}

String* Undefined::toString() const
{
    return new String("undefined");
}

Boolean* Undefined::toBool() const
{
    return new Boolean(false);
}

Boolean* Undefined::equals(Object* other) const
{
    return new Boolean(other == Undefined::instance());
}
