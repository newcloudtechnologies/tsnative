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
#define _USE_MATH_DEFINES

#include "std/private/tsmath_p.h"

#include <cmath>
#include <cstdlib>
#include <limits>
#include <random>

namespace constants
{
const double E = 2.71828182845904523536;
const double LOG2E = 1.44269504088896340736;
const double LOG10E = 0.434294481903251827651;
const double LN2 = 0.693147180559945309417;
const double LN10 = 2.30258509299404568402;
const double PI = M_PI;
const double SQRT2 = 1.41421356237309504880;
const double SQRT1_2 = 0.707106781186547524401;
constexpr const double pow2of32 = 1ull << 32;  // 2^32
constexpr const uint32_t pow2of31 = 1ul << 31; // 2^31
} // namespace constants

double MathPrivate::E() noexcept
{
    return constants::E;
}

double MathPrivate::LN2() noexcept
{
    return constants::LN2;
}

double MathPrivate::LN10() noexcept
{
    return constants::LN10;
}

double MathPrivate::LOG2E() noexcept
{
    return constants::LOG2E;
}

double MathPrivate::LOG10E() noexcept
{
    return constants::LOG10E;
}

double MathPrivate::PI() noexcept
{
    return constants::PI;
}

double MathPrivate::SQRT1_2() noexcept
{
    return constants::SQRT1_2;
}

double MathPrivate::SQRT2() noexcept
{
    return constants::SQRT2;
}

double MathPrivate::abs(double x) noexcept
{
    return std::abs(x);
}

double MathPrivate::acos(double x) noexcept
{
    return std::acos(x);
}

double MathPrivate::acosh(double x) noexcept
{
    return std::acosh(x);
}

double MathPrivate::asin(double x) noexcept
{
    return std::asin(x);
}

double MathPrivate::asinh(double x) noexcept
{
    if (!NumberPrivate::isFinite(x) || x == +0.0 || x == -0.0)
    {
        return x;
    }
    return std::asinh(x);
}

double MathPrivate::atan(double x) noexcept
{
    return std::atan(x);
}

double MathPrivate::atanh(double x) noexcept
{
    if (NumberPrivate::isNaN(x) || x == +0.0 || x == -0.0)
    {
        return x;
    }
    if (x > 1 || x < -1)
    {
        return NumberPrivate::NaN();
    }
    if (x == 1)
    {
        return NumberPrivate::POSITIVE_INFINITY();
    }
    if (x == -1)
    {
        return NumberPrivate::NEGATIVE_INFINITY();
    }
    return std::atanh(x);
}

double MathPrivate::atan2(double y, double x) noexcept
{
    return std::atan2(y, x);
}

double MathPrivate::cbrt(double x) noexcept
{
    return std::cbrt(x);
}

double MathPrivate::ceil(double x) noexcept
{
    return std::ceil(x);
}

std::uint8_t MathPrivate::clz32(double x) noexcept
{
    const auto uint32Val = toUint32(x);

    if (uint32Val == 0)
    {
        return 32;
    }

    std::uint8_t result = 0;
    const std::uint32_t uintX = uint32Val;
    std::uint32_t mask = 1 << 31;
    while (mask != 0 && ((uintX & mask) == 0))
    {
        ++result;
        mask = mask >> 1;
    }
    return result;
}

double MathPrivate::cos(double x) noexcept
{
    return std::cos(x);
}

double MathPrivate::cosh(double x) noexcept
{
    return std::cosh(x);
}

double MathPrivate::exp(double x) noexcept
{
    return std::exp(x);
}

double MathPrivate::expm1(double x) noexcept
{
    if (NumberPrivate::isNaN(x) || x == NumberPrivate::POSITIVE_INFINITY() || x == 0.0)
    {
        return x;
    }
    if (x == NumberPrivate::NEGATIVE_INFINITY())
    {
        return -1.0;
    }
    return exp(x) - 1;
}

double MathPrivate::floor(double x) noexcept
{
    return std::floor(x);
}

double MathPrivate::fround(double x) noexcept
{
    // TODO If does not fit to float then return infinity like JS does
    return static_cast<float>(x);
}

double MathPrivate::hypot(double x, double y) noexcept
{
    return std::hypot(x, y);
}

double MathPrivate::imul(double x, double y) noexcept
{
    const auto a = toUint32(x);
    const auto b = toUint32(y);

    const auto product = modulo(a * b, constants::pow2of32);
    if (product >= constants::pow2of31)
    {
        return product - constants::pow2of32;
    }
    return a * b;
}

double MathPrivate::log(double x) noexcept
{
    return std::log(x);
}

double MathPrivate::log1p(double x) noexcept
{
    return std::log1p(x);
}

double MathPrivate::log10(double x) noexcept
{
    return std::log10(x);
}

double MathPrivate::log2(double x) noexcept
{
    return std::log2(x);
}

double MathPrivate::pow(double x, double y) noexcept
{
    // https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-numeric-types-number-exponentiate
    if (std::isnan(y))
    {
        return constants::g_NaN;
    }

    if (y == constants::g_PositiveInfinity)
    {
        if (abs(x) > 1)
        {
            return constants::g_PositiveInfinity;
        }
        if (abs(x) == 1)
        {
            return constants::g_NaN;
        }
        if (abs(x) < 1)
        {
            return +0;
        }
    }
    if (y == constants::g_NegativeInfinity)
    {
        if (abs(x) > 1)
        {
            return +0;
        }
        if (abs(x) == 1)
        {
            return constants::g_NaN;
        }
        if (abs(x) < 1)
        {
            return constants::g_PositiveInfinity;
        }
    }
    return std::pow(x, y);
}

double MathPrivate::random() noexcept
{
    std::random_device rd;
    std::mt19937 generator(rd());
    std::uniform_real_distribution<> distribution(0.0, 1.0);
    return distribution(generator);
}

double MathPrivate::round(double x) noexcept
{
    static constexpr double eps = 1e-10; // Use eps from Number in the future
    double integralPart = 0;
    const double fractionalPart = std::modf(x, &integralPart);

    // JS rounds -0.5 to 0, C++ rounds -0.5 to -1, so handle precise match
    if (fractionalPart == -0.5)
    {
        x += eps;
    }

    return std::round(x);
}

double MathPrivate::sign(double x) noexcept
{
    if (NumberPrivate::isNaN(x) || x == 0.0)
    {
        return x;
    }
    return std::signbit(x) ? -1 : 1;
}

double MathPrivate::sin(double x) noexcept
{
    return std::sin(x);
}

double MathPrivate::sinh(double x) noexcept
{
    return std::sinh(x);
}

double MathPrivate::sqrt(double x) noexcept
{
    return std::sqrt(x);
}

double MathPrivate::tan(double x) noexcept
{
    return std::tan(x);
}

double MathPrivate::tanh(double x) noexcept
{
    return std::tanh(x);
}

double MathPrivate::trunc(double x) noexcept
{
    return std::trunc(x);
}

double MathPrivate::modulo(double x, double y) noexcept
{
    // “x modulo y” (y must be finite and non-zero) computes a value k of the same sign as y (or zero)
    // such  that abs(k) < abs(y) and x - k = q × y for some integer q.
    // See h ttps://tc39.es/ecma262/multipage/notational-conventions.html#integer
    // x − k  = q × y
    return x - floor(x / y) * y;
}

double MathPrivate::toInteger(double x) noexcept
{
    return x < 0 ? ceil(x) : floor(x);
}

uint32_t MathPrivate::toUint32(double x) noexcept
{
    if (NumberPrivate::isNaN(x) || x == 0 || !NumberPrivate::isFinite(x))
    {
        return 0;
    }
    return static_cast<uint32_t>(modulo(toInteger(x), constants::pow2of32));
}

int32_t MathPrivate::toInt32(double x) noexcept
{
    const auto ui32 = toUint32(x);

    if (ui32 >= constants::pow2of31)
    {
        return static_cast<int32_t>(ui32 - constants::pow2of32);
    }
    return static_cast<int32_t>(ui32);
}
