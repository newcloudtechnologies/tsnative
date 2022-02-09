#include "std/private/tsboolean_cxx_builtin_p.h"

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
