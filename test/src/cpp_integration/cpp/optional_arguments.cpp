#include "optional_arguments.h"

#include <std/gc.h>
#include <std/tsnumber.h>
#include <std/tsoptional.h>
#include <std/tsstring.h>

using namespace cpp;

WithOptionalArgs::WithOptionalArgs(Number *n, TSOptional<String *> *s)
{
    _n = n;
    _s = s->hasValue() ? s->getValue() : getDefaultString();
}

void WithOptionalArgs::setValues(TSOptional<Number *> *n, TSOptional<String *> *s)
{
    _n = n->hasValue() ? n->getValue() : getDefaultNumber();
    _s = s->hasValue() ? s->getValue() : getDefaultString();
}

Number *WithOptionalArgs::getNumber() const
{
    return _n;
}

String *WithOptionalArgs::getString() const
{
    return _s;
}

Number *WithOptionalArgs::getDefaultNumber() const
{
    return GC::track(new Number(888.0));
}

String *WithOptionalArgs::getDefaultString() const
{
    return GC::track(new String("DEFAULT"));
}
