#include "std/tsboolean.h"

#include <sstream>

#include "std/tsnumber.h"
#include "std/tsstring.h"

#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
#include "std/private/tsboolean_cxx_builtin_p.h"
#endif

#include "std/private/logger.h"

Boolean::Boolean()
#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
    : _d(new BooleanCXXBuiltinPrivate)
#endif
{
    LOG_ADDRESS("Calling default bool ctor ", this);
}

Boolean::Boolean(bool value)
#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
    : _d(new BooleanCXXBuiltinPrivate(value))
#endif
{
    LOG_ADDRESS("Calling bool from bool ctor " + std::to_string(value) + " ", this);
}

Boolean::Boolean(Number* value)
#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
    : _d(new BooleanCXXBuiltinPrivate(value->toBool()->unboxed()))
#endif
{
    LOG_ADDRESS("Calling bool from number ctor " + std::to_string(value->unboxed()) + " ", this);
}

Boolean::Boolean(String* value)
#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
    : _d(new BooleanCXXBuiltinPrivate(value->toBool()->unboxed()))
#endif
{
    LOG_ADDRESS("Calling bool from string ctor " + value->cpp_str() + " ", this);
}

Boolean::~Boolean()
{
    LOG_ADDRESS("Calling bool dtor: _d = ", _d);
    delete _d;
}

Boolean* Boolean::negate() const
{
    return new Boolean(!_d->value());
}

Boolean* Boolean::equals(Object* other) const
{
    auto asBoolean = static_cast<Boolean*>(other);
    return new Boolean(_d->value() == asBoolean->unboxed());
}

String* Boolean::toString() const
{
    std::ostringstream oss;
    oss << std::boolalpha << this->unboxed();
    return new String(oss.str());
}

Boolean* Boolean::toBool() const
{
    return clone();
}

bool Boolean::unboxed() const
{
    return _d->value();
}

Boolean* Boolean::clone() const
{
    return new Boolean(this->unboxed());
}
