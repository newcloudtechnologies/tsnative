#include "optional_arguments.h"

#include <std/tsarray.h>
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

void WithOptionalArgs::setMoreValues(Union* n, Union* s, Array<Number*>* items)
{
    setValues(n, s);

    set("items", items);
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

Array<Number*>* WithOptionalArgs::getItems() const
{
    // dynamic_cast doesn't work with rest params because the way it created
    // see https://jira.ncloudtech.ru:8090/browse/TSN-594
    return static_cast<Array<Number*>*>(get("items"));
}