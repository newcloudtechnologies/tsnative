#include "std/private/tsboolean_p.h"

BooleanPrivate::BooleanPrivate()
{
}
BooleanPrivate::BooleanPrivate(bool value)
    : _value(value)
{
}

bool BooleanPrivate::value() const
{
    return _value;
}

void BooleanPrivate::setValue(bool value)
{
    _value = value;
}
