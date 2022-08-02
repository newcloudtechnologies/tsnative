#include "std/tsnumber.h"
#include "std/tsboolean.h"
#include "std/tsstring.h"

#ifdef USE_NUMBER_CXX_BUILTIN_BACKEND
#include "std/private/tsnumber_cxx_builtin_p.h"
#endif

#include <sstream>

#include "std/private/logger.h"

Number::Number(double v)
#ifdef USE_NUMBER_CXX_BUILTIN_BACKEND
    : _d(new NumberCXXBuiltinPrivate(v))
#endif
{
    LOG_INFO("Calling number ctor from double: v = " + std::to_string(v));
    LOG_ADDRESS("This: ", this);
}

Number::Number(Number* v)
#ifdef USE_NUMBER_CXX_BUILTIN_BACKEND
    : _d(new NumberCXXBuiltinPrivate(v->unboxed()))
#endif
{
    LOG_INFO("Calling number ctor from Number*: v = " + std::to_string(v->unboxed()));
    LOG_ADDRESS("This: ", this);
}

Number::~Number()
{
    LOG_ADDRESS("Calling number dtor: _d =", _d);
    delete _d;
}

Number* Number::add(Number* other) const
{
    double result = _d->add(other->unboxed());
    return new Number(result);
}

Number* Number::sub(Number* other) const
{
    double result = _d->sub(other->unboxed());
    return new Number(result);
}

Number* Number::mul(Number* other) const
{
    double result = _d->mul(other->unboxed());
    return new Number(result);
}

Number* Number::div(Number* other) const
{
    double result = _d->div(other->unboxed());
    return new Number(result);
}

Number* Number::mod(Number* other) const
{
    double result = _d->mod(other->unboxed());
    return new Number(result);
}

Number* Number::addInplace(Number* other)
{
    _d->addInplace(other->unboxed());
    return this;
}

Number* Number::subInplace(Number* other)
{
    _d->subInplace(other->unboxed());
    return this;
}

Number* Number::mulInplace(Number* other)
{
    _d->mulInplace(other->unboxed());
    return this;
}

Number* Number::divInplace(Number* other)
{
    _d->divInplace(other->unboxed());
    return this;
}

Number* Number::modInplace(Number* other)
{
    _d->modInplace(other->unboxed());
    return this;
}

Number* Number::negate()
{
    _d->negate();
    return this;
}

Number* Number::prefixIncrement()
{
    _d->prefixIncrement();
    return this;
}

Number* Number::postfixIncrement()
{
    double result = _d->postfixIncrement();
    return new Number(result);
}

Number* Number::prefixDecrement()
{
    _d->postfixDecrement();
    return this;
}

Number* Number::postfixDecrement()
{
    double result = _d->postfixDecrement();
    return new Number(result);
}

Number* Number::bitwiseAnd(Number* other) const
{
    uint64_t result = _d->bitwiseAnd(static_cast<uint64_t>(other->unboxed()));
    return new Number(static_cast<double>(result));
}
Number* Number::bitwiseOr(Number* other) const
{
    uint64_t result = _d->bitwiseOr(static_cast<uint64_t>(other->unboxed()));
    return new Number(static_cast<double>(result));
}
Number* Number::bitwiseXor(Number* other) const
{
    uint64_t result = _d->bitwiseXor(static_cast<uint64_t>(other->unboxed()));
    return new Number(static_cast<double>(result));
}
Number* Number::bitwiseLeftShift(Number* other) const
{
    uint64_t result = _d->bitwiseLeftShift(static_cast<uint64_t>(other->unboxed()));
    return new Number(static_cast<double>(result));
}
Number* Number::bitwiseRightShift(Number* other) const
{
    uint64_t result = _d->bitwiseRightShift(static_cast<uint64_t>(other->unboxed()));
    return new Number(static_cast<double>(static_cast<int64_t>(result)));
}

Number* Number::bitwiseAndInplace(Number* other)
{
    _d->bitwiseAndInplace(static_cast<uint64_t>(other->unboxed()));
    return this;
}
Number* Number::bitwiseOrInplace(Number* other)
{
    _d->bitwiseOrInplace(static_cast<uint64_t>(other->unboxed()));
    return this;
}
Number* Number::bitwiseXorInplace(Number* other)
{
    _d->bitwiseXorInplace(static_cast<uint64_t>(other->unboxed()));
    return this;
}
Number* Number::bitwiseLeftShiftInplace(Number* other)
{
    _d->bitwiseLeftShiftInplace(static_cast<uint64_t>(other->unboxed()));
    return this;
}
Number* Number::bitwiseRightShiftInplace(Number* other)
{
    _d->bitwiseRightShiftInplace(static_cast<uint64_t>(other->unboxed()));
    return this;
}

Boolean* Number::equals(Number* other) const
{
    bool result = _d->equals(other->unboxed());
    return new Boolean(result);
}

Boolean* Number::lessThan(Number* other) const
{
    bool result = _d->lessThan(other->unboxed());
    return new Boolean(result);
}

Boolean* Number::lessEqualsThan(Number* other) const
{
    bool result = _d->lessEqualsThan(other->unboxed());
    return new Boolean(result);
}

Boolean* Number::greaterThan(Number* other) const
{
    bool result = _d->greaterThan(other->unboxed());
    return new Boolean(result);
}

Boolean* Number::greaterEqualsThan(Number* other) const
{
    bool result = _d->greaterEqualsThan(other->unboxed());
    return new Boolean(result);
}

Boolean* Number::toBool() const
{
    bool result = _d->toBool();
    return new Boolean(result);
}

double Number::unboxed() const
{
    return _d->unboxed();
}

Number* Number::clone() const
{
    LOG_ADDRESS("Calling clone from ", this);
    return new Number(this->unboxed());
}

String* Number::toString() const
{
    std::ostringstream oss;
    oss << this->unboxed();
    return new String(oss.str());
}
