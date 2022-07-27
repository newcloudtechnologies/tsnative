#include "optional_arguments.h"

#include <std/gc.h>
#include <std/tsnumber.h>
#include <std/tsunion.h>
#include <std/tsstring.h>

using namespace cpp;

WithOptionalArgs::WithOptionalArgs(Number *n, Union *s)
{
    set("n", n);

    auto sValue = s->hasValue() ? static_cast<String *>(s->getValue()) : getDefaultString();
    set("s", sValue);
}

void WithOptionalArgs::setValues(Union *n, Union *s)
{
    auto nValue = n->hasValue() ? static_cast<Number *>(n->getValue()) : getDefaultNumber();
    auto sValue = s->hasValue() ? static_cast<String *>(s->getValue()) : getDefaultString();

    set("n", nValue);
    set("s", sValue);
}

Number *WithOptionalArgs::getNumber() const
{
    return get<Number *>("n");
}

String *WithOptionalArgs::getString() const
{
    return get<String *>("s");
}

Number *WithOptionalArgs::getDefaultNumber() const
{
    return new Number(888.0);
}

String *WithOptionalArgs::getDefaultString() const
{
    return new String("DEFAULT");
}
