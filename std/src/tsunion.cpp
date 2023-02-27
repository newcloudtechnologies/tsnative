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
    return _value && !_value->isNull() && !_value->isUndefined();
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

std::vector<Object*> Union::getChildObjects() const
{
    auto result = Object::getChildObjects();

    if (_value)
    {
        result.push_back(_value);
    }

    return result;
}