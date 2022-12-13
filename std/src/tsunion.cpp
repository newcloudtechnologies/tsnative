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

#include "std/tsunion.h"

#include "std/tsboolean.h"
#include "std/tsstring.h"

#include "std/private/logger.h"

Union::Union()
    : Object(TSTypeID::Union)
{
    LOG_ADDRESS("Calling Union default ctor this = ", this);
}

Union::Union(Object* value)
    : Object(TSTypeID::Union)
    , _value(value)
{
    LOG_ADDRESS("Calling Union default ctor this = ", this);
}

Object* Union::getValue() const
{
    LOG_ADDRESS("Calling union :: getValue for ", this);
    LOG_ADDRESS("Resulting value is ", _value);
    return _value;
}

void Union::setValue(Object* value)
{
    _value = value;
}

bool Union::hasValue()
{
    // mkrv @todo: i would prefer to introduce ID's system for every std builtin to avoid string comparison... later
    const std::string& asString = toString()->cpp_str();
    return asString != "null" && asString != "undefined";
}

String* Union::toString() const
{
    return _value->toString();
}

Boolean* Union::toBool() const
{
    return _value->toBool();
}

Boolean* Union::equals(Object* other) const
{
    if (other->isUnion())
    {
        other = static_cast<Union*>(other)->getValue();
    }

    return getValue()->equals(other);
}

void Union::markChildren()
{
    LOG_ADDRESS("Calling Union::markChildren on ", this);

    if (_value && !_value->isMarked())
    {
        LOG_ADDRESS("Mark child: ", _value);
        _value->mark();
    }
}