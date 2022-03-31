#include "std/tsunion.h"

#include "std/tsboolean.h"
#include "std/tsstring.h"

Union::Union()
{
}

Union::Union(Object* value)
    : _value(value)
{
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
