#include "std/private/tsnumber_p.h"

#include "std/gc.h"
#include "std/tsnumber.h"
#include "std/tsstring.h"

#include <cmath>
#include <sstream>

NumberPrivate::NumberPrivate()
{
}
NumberPrivate::NumberPrivate(double v)
    : _value(v)
{
}

Number* NumberPrivate::add(const Number* other) const
{
    auto result = _value + other->unboxed();
    return GC::createHeapAllocated<Number>(result);
}
Number* NumberPrivate::sub(const Number* other) const
{
    auto result = _value - other->unboxed();
    return GC::createHeapAllocated<Number>(result);
}
Number* NumberPrivate::mul(const Number* other) const
{
    auto result = _value * other->unboxed();
    return GC::createHeapAllocated<Number>(result);
}
Number* NumberPrivate::div(const Number* other) const
{
    auto result = _value / other->unboxed();
    return GC::createHeapAllocated<Number>(result);
}
Number* NumberPrivate::mod(const Number* other) const
{
    auto result = std::fmod(_value, other->unboxed());
    return GC::createHeapAllocated<Number>(result);
}

void NumberPrivate::addInplace(const Number* other)
{
    _value += other->unboxed();
}
void NumberPrivate::subInplace(const Number* other)
{
    _value -= other->unboxed();
}
void NumberPrivate::mulInplace(const Number* other)
{
    _value *= other->unboxed();
}
void NumberPrivate::divInplace(const Number* other)
{
    _value /= other->unboxed();
}
void NumberPrivate::modInplace(const Number* other)
{
    _value = std::fmod(_value, other->unboxed());
}

void NumberPrivate::negate()
{
    _value = -_value;
}

void NumberPrivate::prefixIncrement()
{
    ++_value;
}
Number* NumberPrivate::postfixIncrement()
{
    auto oldValue = GC::createHeapAllocated<Number>(_value);
    ++_value;

    return oldValue;
}

void NumberPrivate::prefixDecrement()
{
    --_value;
}
Number* NumberPrivate::postfixDecrement()
{
    auto oldValue = GC::createHeapAllocated<Number>(_value);
    --_value;

    return oldValue;
}

Number* NumberPrivate::bitwiseAnd(const Number* other) const
{
    auto result = static_cast<uint64_t>(_value) & static_cast<uint64_t>(other->unboxed());
    return GC::createHeapAllocated<Number>(static_cast<double>(result));
}
Number* NumberPrivate::bitwiseOr(const Number* other) const
{
    auto result = static_cast<uint64_t>(_value) | static_cast<uint64_t>(other->unboxed());
    return GC::createHeapAllocated<Number>(static_cast<double>(result));
}
Number* NumberPrivate::bitwiseXor(const Number* other) const
{
    auto result = static_cast<uint64_t>(_value) ^ static_cast<uint64_t>(other->unboxed());
    return GC::createHeapAllocated<Number>(static_cast<double>(result));
}
Number* NumberPrivate::bitwiseLeftShift(const Number* other) const
{
    auto result = static_cast<uint64_t>(_value) << static_cast<uint64_t>(other->unboxed());
    return GC::createHeapAllocated<Number>(static_cast<double>(result));
}
Number* NumberPrivate::bitwiseRightShift(const Number* other) const
{
    // mkrv @todo: actually it is a compiler-dependent stuff
    auto result = static_cast<int64_t>(_value) >> static_cast<int64_t>(other->unboxed());
    return GC::createHeapAllocated<Number>(static_cast<double>(result));
}

void NumberPrivate::bitwiseAndInplace(const Number* other)
{
    _value = static_cast<uint64_t>(_value) & static_cast<uint64_t>(other->unboxed());
}
void NumberPrivate::bitwiseOrInplace(const Number* other)
{
    _value = static_cast<uint64_t>(_value) | static_cast<uint64_t>(other->unboxed());
}
void NumberPrivate::bitwiseXorInplace(const Number* other)
{
    _value = static_cast<uint64_t>(_value) ^ static_cast<uint64_t>(other->unboxed());
}
void NumberPrivate::bitwiseLeftShiftInplace(const Number* other)
{
    _value = static_cast<uint64_t>(_value) << static_cast<uint64_t>(other->unboxed());
}
void NumberPrivate::bitwiseRightShiftInplace(const Number* other)
{
    // mkrv @todo: actually it is a compiler-dependent stuff
    _value = static_cast<int64_t>(_value) >> static_cast<int64_t>(other->unboxed());
}

Boolean* NumberPrivate::equals(const Number* other) const
{
    // mkrv @todo: well, this is how doubles shouldn't be compared
    return GC::createHeapAllocated<Boolean>(_value == other->unboxed());
}
Boolean* NumberPrivate::lessThan(const Number* other) const
{
    return GC::createHeapAllocated<Boolean>(_value < other->unboxed());
}
Boolean* NumberPrivate::lessEqualsThan(const Number* other) const
{
    return GC::createHeapAllocated<Boolean>(_value <= other->unboxed());
}
Boolean* NumberPrivate::greaterThan(const Number* other) const
{
    return GC::createHeapAllocated<Boolean>(_value > other->unboxed());
}
Boolean* NumberPrivate::greaterEqualsThan(const Number* other) const
{
    return GC::createHeapAllocated<Boolean>(_value >= other->unboxed());
}

Boolean* NumberPrivate::toBool() const
{
    return GC::createHeapAllocated<Boolean>(_value != 0.0);
}

double NumberPrivate::unboxed() const
{
    return _value;
}
