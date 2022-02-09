#include "std/tsboolean.h"

#include <sstream>

#include "std/tsnumber.h"
#include "std/tsstring.h"

#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
#include "std/private/tsboolean_cxx_builtin_p.h"
#endif

Boolean::Boolean()
#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
    : _d(new BooleanCXXBuiltinPrivate)
#endif
{
}

Boolean::Boolean(bool value)
#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
    : _d(new BooleanCXXBuiltinPrivate(value))
#endif
{
}

Boolean::Boolean(Number* value)
#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
    : _d(new BooleanCXXBuiltinPrivate(value->toBool()->unboxed()))
#endif
{
}
Boolean::Boolean(String* value)
#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
    : _d(new BooleanCXXBuiltinPrivate(value->toBool()->unboxed()))
#endif
{
}

Boolean::~Boolean()
{
    delete _d;
}

Boolean* Boolean::negate() const
{
    return GC::track(new Boolean(!_d->value()));
}

Boolean* Boolean::equals(Boolean* other) const
{
    return GC::track(new Boolean(_d->value() == other->unboxed()));
}

String* Boolean::toString() const
{
    std::ostringstream oss;
    oss << this;
    return GC::track(new String(oss.str()));
}

bool Boolean::unboxed() const
{
    return _d->value();
}

Boolean* Boolean::clone() const
{
    return GC::track(new Boolean(this->unboxed()));
}
