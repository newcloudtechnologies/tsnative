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

void Union::markChildren()
{
    LOG_ADDRESS("Calling Union::markChildren on ", this);

    if (_value && !_value->isMarked())
    {
        LOG_ADDRESS("Mark child: ", _value);
        _value->mark();
    }
}