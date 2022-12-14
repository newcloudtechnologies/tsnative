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

#pragma once

#include <cmath>
#include <cstdint>
#include <limits>

namespace constants
{
using DoubleTraits = std::numeric_limits<double>;

constexpr const double g_NaN = DoubleTraits::quiet_NaN();
constexpr const double g_PositiveInfinity = DoubleTraits::infinity();
constexpr const double g_NegativeInfinity = DoubleTraits::infinity() * -1;
constexpr const double g_Epsilon = DoubleTraits::epsilon();
constexpr const double g_MaxValue = DoubleTraits::max();
constexpr const double g_MinValue = DoubleTraits::min();

// 2^53 - 1. See https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-number.max_safe_integer
constexpr double g_MaxSafeInteger = 9'007'199'254'740'991;
constexpr double g_MinSafeInteger = g_MaxSafeInteger * -1;
} // namespace constants

class NumberPrivate
{
public:
    static double NaN() noexcept
    {
        return constants::g_NaN;
    }

    static double POSITIVE_INFINITY() noexcept
    {
        return constants::g_PositiveInfinity;
    }

    static double NEGATIVE_INFINITY() noexcept
    {
        return constants::g_NegativeInfinity;
    }

    static double EPSILON() noexcept
    {
        return constants::g_Epsilon;
    }

    static double MAX_VALUE() noexcept
    {
        return constants::g_MaxValue;
    }

    static double MIN_VALUE() noexcept
    {
        return constants::g_MinValue;
    }

    static double MAX_SAFE_INTEGER() noexcept
    {
        return constants::g_MaxSafeInteger;
    }

    static double MIN_SAFE_INTEGER() noexcept
    {
        return constants::g_MinSafeInteger;
    }

    static bool isNaN(double value) noexcept
    {
        return std::isnan(value);
    }

    static bool isFinite(double value) noexcept
    {
        return std::isfinite(value);
    }

    static bool isInteger(double value) noexcept
    {
        if (isNaN(value) || !isFinite(value))
        {
            return false;
        }
        const double absValue = std::abs(value);

        return std::floor(absValue) == absValue;
    }

    static bool isSafeInteger(double value)
    {
        if (isInteger(value))
        {
            if (std::abs(value) <= constants::g_MaxSafeInteger)
            {
                return true;
            }
        }
        return false;
    }

    virtual ~NumberPrivate() = default;

    virtual double add(double other) const = 0;
    virtual double sub(double other) const = 0;
    virtual double mul(double other) const = 0;
    virtual double div(double other) const = 0;
    virtual double mod(double other) const = 0;

    virtual void addInplace(double other) = 0;
    virtual void subInplace(double other) = 0;
    virtual void mulInplace(double other) = 0;
    virtual void divInplace(double other) = 0;
    virtual void modInplace(double other) = 0;

    virtual double negate() const = 0;

    virtual void prefixIncrement() = 0;
    virtual double postfixIncrement() = 0;

    virtual void prefixDecrement() = 0;
    virtual double postfixDecrement() = 0;

    virtual uint64_t bitwiseAnd(uint64_t other) const = 0;
    virtual uint64_t bitwiseOr(uint64_t other) const = 0;
    virtual uint64_t bitwiseXor(uint64_t other) const = 0;
    virtual uint64_t bitwiseLeftShift(uint64_t other) const = 0;
    virtual uint64_t bitwiseRightShift(uint64_t other) const = 0;

    virtual void bitwiseAndInplace(uint64_t other) = 0;
    virtual void bitwiseOrInplace(uint64_t other) = 0;
    virtual void bitwiseXorInplace(uint64_t other) = 0;
    virtual void bitwiseLeftShiftInplace(uint64_t other) = 0;
    virtual void bitwiseRightShiftInplace(uint64_t other) = 0;

    virtual bool equals(double other) const = 0;
    virtual bool lessThan(double other) const = 0;
    virtual bool lessEqualsThan(double other) const = 0;
    virtual bool greaterThan(double other) const = 0;
    virtual bool greaterEqualsThan(double other) const = 0;

    virtual bool toBool() const = 0;

    virtual double unboxed() const = 0;
};
