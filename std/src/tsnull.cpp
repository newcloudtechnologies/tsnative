#include "std/tsnull.h"

#include "std/tsboolean.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

Null::Null()
    : Object(TSTypeID::Null)
{
    LOG_ADDRESS("Calling Null ctor ", this);
}

Null* Null::instancePtr = nullptr;

Null* Null::instance()
{
    if (!instancePtr)
    {
        instancePtr = new Null{};
    }
    return instancePtr;
}

String* Null::toString() const
{
    return new String("null");
}

Boolean* Null::toBool() const
{
    return new Boolean(false);
}

Boolean* Null::equals(Object* other) const
{
    return new Boolean(other == Null::instance());
}
