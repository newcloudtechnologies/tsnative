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

#include "optional_arguments.h"

#include <std/tsnumber.h>
#include <std/tsstring.h>
#include <std/tsunion.h>

using namespace cpp_integration;

WithOptionalArgs::WithOptionalArgs(Number* n, Union* s)
{
    set("n", n);

    auto sValue = s->hasValue() ? static_cast<String*>(s->getValue()) : getDefaultString();
    set("s", sValue);
}

void WithOptionalArgs::setValues(Union* n, Union* s)
{
    auto nValue = n->hasValue() ? static_cast<Number*>(n->getValue()) : getDefaultNumber();
    auto sValue = s->hasValue() ? static_cast<String*>(s->getValue()) : getDefaultString();

    set("n", nValue);
    set("s", sValue);
}

void WithOptionalArgs::setString(String* s)
{
    set("s", s);
}

Number* WithOptionalArgs::getNumber() const
{
    return get<Number*>("n");
}

String* WithOptionalArgs::getString() const
{
    return get<String*>("s");
}

Number* WithOptionalArgs::getDefaultNumber() const
{
    return new Number(888.0);
}

String* WithOptionalArgs::getDefaultString() const
{
    return new String("DEFAULT");
}
