#include "std/private/tsnumber_cxx_builtin_p.h"

#include <cmath>
#include <sstream>
#include <string>

NumberCXXBuiltinPrivate::NumberCXXBuiltinPrivate(double v)
    : _value(v)
{
}

double NumberCXXBuiltinPrivate::add(double other) const
{
    return _value + other;
}

double NumberCXXBuiltinPrivate::sub(double other) const
{
    return _value - other;
}

double NumberCXXBuiltinPrivate::mul(double other) const
{
    return _value * other;
}

double NumberCXXBuiltinPrivate::div(double other) const
{
    return _value / other;
}

double NumberCXXBuiltinPrivate::mod(double other) const
{
    return std::fmod(_value, other);
}

void NumberCXXBuiltinPrivate::addInplace(double other)
{
    _value += other;
}

void NumberCXXBuiltinPrivate::subInplace(double other)
{
    _value -= other;
}

void NumberCXXBuiltinPrivate::mulInplace(double other)
{
    _value *= other;
}

void NumberCXXBuiltinPrivate::divInplace(double other)
{
    _value /= other;
}

void NumberCXXBuiltinPrivate::modInplace(double other)
{
    _value = std::fmod(_value, other);
}

double NumberCXXBuiltinPrivate::negate() const
{
    return -_value;
}

void NumberCXXBuiltinPrivate::prefixIncrement()
{
    ++_value;
}

double NumberCXXBuiltinPrivate::postfixIncrement()
{
    double old = _value;
    prefixIncrement();
    return old;
}

void NumberCXXBuiltinPrivate::prefixDecrement()
{
    --_value;
}

double NumberCXXBuiltinPrivate::postfixDecrement()
{
    double old = _value;
    prefixDecrement();
    return old;
}

uint64_t NumberCXXBuiltinPrivate::bitwiseAnd(uint64_t other) const
{
    return static_cast<uint64_t>(_value) & other;
}

uint64_t NumberCXXBuiltinPrivate::bitwiseOr(uint64_t other) const
{
    return static_cast<uint64_t>(_value) | other;
}

uint64_t NumberCXXBuiltinPrivate::bitwiseXor(uint64_t other) const
{
    return static_cast<uint64_t>(_value) ^ other;
}

uint64_t NumberCXXBuiltinPrivate::bitwiseLeftShift(uint64_t other) const
{
    return static_cast<uint64_t>(_value) << other;
}

uint64_t NumberCXXBuiltinPrivate::bitwiseRightShift(uint64_t other) const
{
    // mkrv @todo: actually it is a compiler-dependent stuff
    return static_cast<int64_t>(_value) >> static_cast<int64_t>(other);
}

void NumberCXXBuiltinPrivate::bitwiseAndInplace(uint64_t other)
{
    _value = static_cast<double>(bitwiseAnd(other));
}

void NumberCXXBuiltinPrivate::bitwiseOrInplace(uint64_t other)
{
    _value = static_cast<double>(bitwiseOr(other));
}

void NumberCXXBuiltinPrivate::bitwiseXorInplace(uint64_t other)
{
    _value = static_cast<double>(bitwiseXor(other));
}

void NumberCXXBuiltinPrivate::bitwiseLeftShiftInplace(uint64_t other)
{
    _value = static_cast<double>(bitwiseLeftShift(other));
}

void NumberCXXBuiltinPrivate::bitwiseRightShiftInplace(uint64_t other)
{
    _value = static_cast<double>(static_cast<int64_t>(bitwiseRightShift(other)));
}

bool NumberCXXBuiltinPrivate::equals(double other) const
{
    // mkrv @todo: well, this is how doubles shouldn't be compared
    return _value == other;
}

bool NumberCXXBuiltinPrivate::lessThan(double other) const
{
    return _value < other;
}

bool NumberCXXBuiltinPrivate::lessEqualsThan(double other) const
{
    return _value <= other;
}

bool NumberCXXBuiltinPrivate::greaterThan(double other) const
{
    return _value > other;
}

bool NumberCXXBuiltinPrivate::greaterEqualsThan(double other) const
{
    return _value >= other;
}

bool NumberCXXBuiltinPrivate::toBool() const
{
    return _value != 0.0 && !std::isnan(_value);
}

double NumberCXXBuiltinPrivate::unboxed() const
{
    return _value;
}

std::string NumberCXXBuiltinPrivate::toString() const
{
    std::ostringstream oss;

    const double unboxedValue = this->unboxed();
    if (NumberPrivate::isNaN(unboxedValue))
    {
        oss << "NaN";
    }
    else if (!NumberPrivate::isFinite(unboxedValue))
    {
        oss << (NumberPrivate::POSITIVE_INFINITY() == unboxedValue ? "Infinity" : "-Infinity");
    }
    else
    {
        oss << this->unboxed();
    }
    return oss.str();
}

bool NumberCXXBuiltinPrivate::operator==(const NumberPrivate& other) const noexcept
{
    const auto& casted = static_cast<const NumberCXXBuiltinPrivate&>(other);
    return *this == casted._value;
}

bool NumberCXXBuiltinPrivate::operator==(double other) const noexcept
{
    return std::fabs(_value - other) < constants::g_Epsilon;
}