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