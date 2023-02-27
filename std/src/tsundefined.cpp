/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "std/tsundefined.h"
#include "std/tsboolean.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

Undefined::Undefined()
    : Object(TSTypeID::Undefined)
{
    LOG_ADDRESS("Calling Undefined ctor ", this);
}

Undefined* Undefined::instance()
{
    static Undefined inst;

    return &inst;
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
