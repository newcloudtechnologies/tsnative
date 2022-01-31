#include "std/tsboolean.h"

#include <sstream>

#include "std/tsnumber.h"
#include "std/tsstring.h"

#include "std/private/tsboolean_p.h"

Boolean::Boolean()
    : _d(new BooleanPrivate)
{
}
Boolean::Boolean(bool value)
    : _d(new BooleanPrivate(value))
{
}
Boolean::Boolean(Number* value)
    : _d(new BooleanPrivate(value->toBool()->unboxed()))
{
}
Boolean::Boolean(String* value)
    : _d(new BooleanPrivate(value->toBool()->unboxed()))
{
}

Boolean::~Boolean()
{
    delete _d;
}

Boolean* Boolean::negate() const
{
    return GC::createHeapAllocated<Boolean>(!_d->value());
}

Boolean* Boolean::equals(Boolean* other) const
{
    return GC::createHeapAllocated<Boolean>(_d->value() == other->unboxed());
}

String* Boolean::toString() const
{
    std::ostringstream oss;
    oss << this;
    return GC::createHeapAllocated<String>(oss.str());
}

void Boolean::setValue(bool value)
{
    _d->setValue(value);
}

bool Boolean::unboxed() const
{
    return _d->value();
}

Boolean* Boolean::clone() const
{
    return GC::track(new Boolean(this->unboxed()));
}
