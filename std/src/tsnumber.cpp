#include "std/tsnumber.h"
#include "std/gc.h"
#include "std/stdstring.h"

#include <cmath>
#include <iomanip>
#include <limits>
#include <sstream>

Number::Number(double v)
    : _value(v)
{
}

Number::Number(Number* v)
    : _value(v->_value)
{
}

Number* Number::add(const Number* other) const
{
    auto result = this->valueOf() + other->valueOf();
    return GC::createHeapAllocated<Number>(result);
}

Number* Number::sub(const Number* other) const
{
    auto result = this->valueOf() - other->valueOf();
    return GC::createHeapAllocated<Number>(result);
}

Number* Number::mul(const Number* other) const
{
    auto result = this->valueOf() * other->valueOf();
    return GC::createHeapAllocated<Number>(result);
}

Number* Number::div(const Number* other) const
{
    auto result = this->valueOf() / other->valueOf();
    return GC::createHeapAllocated<Number>(result);
}

Number* Number::mod(const Number* other) const
{
    auto result = std::fmod(this->valueOf(), other->valueOf());
    return GC::createHeapAllocated<Number>(result);
}

Number* Number::addInplace(const Number* other)
{
    _value += other->_value;
    return this;
}

Number* Number::subInplace(const Number* other)
{
    _value -= other->_value;
    return this;
}

Number* Number::mulInplace(const Number* other)
{
    _value *= other->_value;
    return this;
}

Number* Number::divInplace(const Number* other)
{
    _value /= other->_value;
    return this;
}

Number* Number::modInplace(const Number* other)
{
    _value = std::fmod(_value, other->_value);
    return this;
}

Number* Number::negate()
{
    _value = -_value;
    return this;
}

Number* Number::prefixIncrement()
{
    ++_value;
    return this;
}

Number* Number::postfixIncrement()
{
    auto oldValue = GC::createHeapAllocated<Number>(_value);
    ++_value;

    return oldValue;
}

Number* Number::prefixDecrement()
{
    --_value;
    return this;
}

Number* Number::postfixDecrement()
{
    auto oldValue = GC::createHeapAllocated<Number>(_value);
    --_value;

    return oldValue;
}

Number* Number::bitwiseAnd(const Number* other) const
{
    auto result = static_cast<uint64_t>(this->valueOf()) & static_cast<uint64_t>(other->valueOf());
    return GC::createHeapAllocated<Number>(static_cast<double>(result));
}
Number* Number::bitwiseOr(const Number* other) const
{
    auto result = static_cast<uint64_t>(this->valueOf()) | static_cast<uint64_t>(other->valueOf());
    return GC::createHeapAllocated<Number>(static_cast<double>(result));
}
Number* Number::bitwiseXor(const Number* other) const
{
    auto result = static_cast<uint64_t>(this->valueOf()) ^ static_cast<uint64_t>(other->valueOf());
    return GC::createHeapAllocated<Number>(static_cast<double>(result));
}
Number* Number::bitwiseLeftShift(const Number* other) const
{
    auto result = static_cast<uint64_t>(this->valueOf()) << static_cast<uint64_t>(other->valueOf());
    return GC::createHeapAllocated<Number>(static_cast<double>(result));
}
Number* Number::bitwiseRightShift(const Number* other) const
{
    // mkrv @todo: actually it is a compiler-dependent stuff
    auto result = static_cast<int64_t>(this->valueOf()) >> static_cast<int64_t>(other->valueOf());
    return GC::createHeapAllocated<Number>(static_cast<double>(result));
}

Number* Number::bitwiseAndInplace(const Number* other)
{
    _value = static_cast<uint64_t>(_value) & static_cast<uint64_t>(other->_value);
    return this;
}
Number* Number::bitwiseOrInplace(const Number* other)
{
    _value = static_cast<uint64_t>(_value) | static_cast<uint64_t>(other->_value);
    return this;
}
Number* Number::bitwiseXorInplace(const Number* other)
{
    _value = static_cast<uint64_t>(_value) ^ static_cast<uint64_t>(other->_value);
    return this;
}
Number* Number::bitwiseLeftShiftInplace(const Number* other)
{
    _value = static_cast<uint64_t>(_value) << static_cast<uint64_t>(other->_value);
    return this;
}
Number* Number::bitwiseRightShiftInplace(const Number* other)
{
    // mkrv @todo: actually it is a compiler-dependent stuff
    _value = static_cast<int64_t>(_value) >> static_cast<int64_t>(other->_value);
    return this;
}

bool Number::equals(const Number* other) const
{
    // mkrv @todo: well, this is how doubles shouldn't be compared
    return _value == other->_value;
}

bool Number::lessThan(const Number* other) const
{
    return _value < other->_value;
}

bool Number::lessEqualsThan(const Number* other) const
{
    return _value <= other->_value;
}

bool Number::greaterThan(const Number* other) const
{
    return _value > other->_value;
}

bool Number::greaterEqualsThan(const Number* other) const
{
    return _value >= other->_value;
}

bool Number::toBool() const
{
    return _value != 0.0;
}

string* Number::toString()
{
    std::ostringstream oss;
    oss << this;
    return GC::createHeapAllocated<string>(oss.str());
}
