/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "std/tsnull.h"

#include "std/tsboolean.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

Null::Null()
    : Object(TSTypeID::Null)
{
    LOG_ADDRESS("Calling Null ctor ", this);
}

Null* Null::instance()
{
    static Null inst;

    return &inst;
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
