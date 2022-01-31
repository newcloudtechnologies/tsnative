#include "std/tsnumber.h"
#include "std/gc.h"
#include "std/tsboolean.h"
#include "std/tsstring.h"

#include "std/private/tsnumber_p.h"

#include <cmath>
#include <iomanip>
#include <limits>
#include <sstream>

Number::Number(double v)
    : _d(new NumberPrivate(v))
{
}

Number::Number(Number* v)
    : _d(new NumberPrivate(v->unboxed()))
{
}

Number* Number::add(const Number* other) const
{
    return _d->add(other);
}

Number* Number::sub(const Number* other) const
{
    return _d->sub(other);
}

Number* Number::mul(const Number* other) const
{
    return _d->mul(other);
}

Number* Number::div(const Number* other) const
{
    return _d->div(other);
}

Number* Number::mod(const Number* other) const
{
    return _d->mod(other);
}

Number* Number::addInplace(const Number* other)
{
    _d->addInplace(other);
    return this;
}

Number* Number::subInplace(const Number* other)
{
    _d->subInplace(other);
    return this;
}

Number* Number::mulInplace(const Number* other)
{
    _d->mulInplace(other);
    return this;
}

Number* Number::divInplace(const Number* other)
{
    _d->divInplace(other);
    return this;
}

Number* Number::modInplace(const Number* other)
{
    _d->modInplace(other);
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
    return _d->postfixIncrement();
}

Number* Number::prefixDecrement()
{
    _d->postfixDecrement();
    return this;
}

Number* Number::postfixDecrement()
{
    return _d->postfixDecrement();
}

Number* Number::bitwiseAnd(const Number* other) const
{
    return _d->bitwiseAnd(other);
}
Number* Number::bitwiseOr(const Number* other) const
{
    return _d->bitwiseOr(other);
}
Number* Number::bitwiseXor(const Number* other) const
{
    return _d->bitwiseXor(other);
}
Number* Number::bitwiseLeftShift(const Number* other) const
{
    return _d->bitwiseLeftShift(other);
}
Number* Number::bitwiseRightShift(const Number* other) const
{
    return _d->bitwiseRightShift(other);
}

Number* Number::bitwiseAndInplace(const Number* other)
{
    _d->bitwiseAndInplace(other);
    return this;
}
Number* Number::bitwiseOrInplace(const Number* other)
{
    _d->bitwiseOrInplace(other);
    return this;
}
Number* Number::bitwiseXorInplace(const Number* other)
{
    _d->bitwiseXorInplace(other);
    return this;
}
Number* Number::bitwiseLeftShiftInplace(const Number* other)
{
    _d->bitwiseLeftShiftInplace(other);
    return this;
}
Number* Number::bitwiseRightShiftInplace(const Number* other)
{
    _d->bitwiseRightShiftInplace(other);
    return this;
}

Boolean* Number::equals(const Number* other) const
{
    return _d->equals(other);
}

Boolean* Number::lessThan(const Number* other) const
{
    return _d->lessThan(other);
}

Boolean* Number::lessEqualsThan(const Number* other) const
{
    return _d->lessEqualsThan(other);
}

Boolean* Number::greaterThan(const Number* other) const
{
    return _d->greaterThan(other);
}

Boolean* Number::greaterEqualsThan(const Number* other) const
{
    return _d->greaterEqualsThan(other);
}

Boolean* Number::toBool() const
{
    return _d->toBool();
}

double Number::unboxed() const
{
    return _d->unboxed();
}

Number* Number::clone() const
{
    return GC::track(new Number(this->unboxed()));
}

String* Number::toString()
{
    std::ostringstream oss;
    oss << this;
    return GC::createHeapAllocated<String>(oss.str());
}
