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

#include "std/tsboolean.h"

#include <sstream>

#include "std/tsnumber.h"
#include "std/tsstring.h"

#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
#include "std/private/tsboolean_cxx_builtin_p.h"
#endif

#include "std/private/logger.h"
#include "std/private/to_string_impl.h"

Boolean::Boolean()
    : Object(TSTypeID::Boolean)
#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
    , _d(new BooleanCXXBuiltinPrivate)
#endif
{
    LOG_ADDRESS("Calling default bool ctor ", this);
}

Boolean::Boolean(bool value)
    : Object(TSTypeID::Boolean)
#ifdef USE_BOOLEAN_CXX_BUILTIN_BACKEND
    , _d(new BooleanCXXBuiltinPrivate(value))
#endif
{
    LOG_ADDRESS("Calling bool from bool ctor " + std::to_string(value) + " ", this);
}

Boolean::Boolean(Number* value)
    : Boolean(value->toBool()->unboxed())
{
    LOG_ADDRESS("Calling bool from number ctor " + std::to_string(value->unboxed()) + " ", this);
}

Boolean::Boolean(String* value)
    : Boolean(value->toBool()->unboxed())
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
    if (!other->isBoolean())
    {
        return new Boolean(false);
    }

    auto asBoolean = static_cast<Boolean*>(other);
    return new Boolean(_d->value() == asBoolean->unboxed());
}

std::string Boolean::toStdString() const
{
    std::ostringstream oss;
    oss << std::boolalpha << this->unboxed();
    return oss.str();
}

DEFAULT_TO_STRING_IMPL(Boolean)

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
