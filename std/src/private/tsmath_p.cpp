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

#include "std/private/tsmath_p.h"

#include <cmath>
#include <cstdlib>
#include <limits>
#include <random>

namespace Constants
{
const double E = 2.71828182845904523536;
const double LOG2E = 1.44269504088896340736;
const double LOG10E = 0.434294481903251827651;
const double LN2 = 0.693147180559945309417;
const double LN10 = 2.30258509299404568402;
const double PI = M_PI;
const double SQRT2 = 1.41421356237309504880;
const double SQRT1_2 = 0.707106781186547524401;
}; // namespace Constants

double MathPrivate::E() noexcept
{
    return Constants::E;
}

double MathPrivate::LN2() noexcept
{
    return Constants::LN2;
}

double MathPrivate::LN10() noexcept
{
    return Constants::LN10;
}

double MathPrivate::LOG2E() noexcept
{
    return Constants::LOG2E;
}

double MathPrivate::LOG10E() noexcept
{
    return Constants::LOG10E;
}

double MathPrivate::PI() noexcept
{
    return Constants::PI;
}

double MathPrivate::SQRT1_2() noexcept
{
    return Constants::SQRT1_2;
}

double MathPrivate::SQRT2() noexcept
{
    return Constants::SQRT2;
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
    return std::asinh(x);
}

double MathPrivate::atan(double x) noexcept
{
    return std::atan(x);
}

double MathPrivate::atanh(double x) noexcept
{
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
    const double floored = std::trunc(x);

    if (floored < std::numeric_limits<std::int32_t>::min() || floored > std::numeric_limits<std::int32_t>::max())
    {
        return 0; // TODO Should we throw here?
    }

    const auto intX = static_cast<int32_t>(floored);
    if (intX < 0)
    {
        return 0; // Sign bit goes first, no zeros before it
    }

    // Would be great to implement using binary search instead of O(32)
    std::uint8_t result = 0;
    const std::uint32_t uintX = std::abs(intX);

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
    return std::sqrt(x * x + y * y);
}

double MathPrivate::imul(double x, double y) noexcept
{
    // TODO here we are supposed to have fast integer multiplication algorithm
    // Float parts from doubles are simply thrown away
    return std::trunc(x) * std::trunc(y);
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
    if (x == -0.0 || x == 0.0)
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