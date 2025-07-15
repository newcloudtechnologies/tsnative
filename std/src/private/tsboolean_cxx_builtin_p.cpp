#include "std/private/tsboolean_cxx_builtin_p.h"

#include <sstream>

BooleanCXXBuiltinPrivate::BooleanCXXBuiltinPrivate(bool value)
    : _value(value)
{
}

bool BooleanCXXBuiltinPrivate::value() const
{
    return _value;
}

void BooleanCXXBuiltinPrivate::setValue(bool value)
{
    _value = value;
}

std::string BooleanCXXBuiltinPrivate::toString() const
{
    std::ostringstream oss;
    oss << std::boolalpha << _value;
    return oss.str();
}