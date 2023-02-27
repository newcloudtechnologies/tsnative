/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <algorithm> // std::min, std::max
#include <cstdint>   // std::uint8_t
#include <type_traits>

#include "std/private/algorithms.h"
#include "std/private/tsnumber_p.h"

class MathPrivate
{
public:
    MathPrivate() = delete;

    static double E() noexcept;
    static double LN2() noexcept;
    static double LN10() noexcept;
    static double LOG2E() noexcept;
    static double LOG10E() noexcept;
    static double PI() noexcept;
    static double SQRT1_2() noexcept;
    static double SQRT2() noexcept;

    static double abs(double x) noexcept;
    static double acos(double x) noexcept;
    static double acosh(double x) noexcept;
    static double asin(double x) noexcept;
    static double asinh(double x) noexcept;
    static double atan(double x) noexcept;
    static double atanh(double x) noexcept;
    static double atan2(double y, double x) noexcept;
    static double cbrt(double x) noexcept;
    static double ceil(double x) noexcept;
    static std::uint8_t clz32(double x) noexcept;
    static double cos(double x) noexcept;
    static double cosh(double x) noexcept;
    static double exp(double x) noexcept;
    static double expm1(double x) noexcept;
    static double floor(double x) noexcept;
    static double fround(double x) noexcept;
    static double hypot(double x, double y) noexcept;
    static double imul(double x, double y) noexcept;
    static double log(double x) noexcept;
    static double log1p(double x) noexcept;
    static double log10(double x) noexcept;
    static double log2(double x) noexcept;

    // Floating points cannot be template paramters according to c++ standard, so use typename and static_assertion
    template <typename... Args>
    static double min(Args... args) noexcept
    {
        checkDoubleTraits(args...);

        return hasNaN(args...) ? NumberPrivate::NaN() : std::min({args...});
    }

    static double min() noexcept
    {
        return NumberPrivate::POSITIVE_INFINITY();
    }

    // Floating points cannot be template paramters according to c++ standard, so use typename and static_assertion
    template <typename... Args>
    static double max(Args... args) noexcept
    {
        checkDoubleTraits(args...);

        return hasNaN(args...) ? NumberPrivate::NaN() : std::max({args...});
    }

    static double max() noexcept
    {
        return NumberPrivate::NEGATIVE_INFINITY();
    }

    static double pow(double x, double y) noexcept;
    static double random() noexcept;
    static double round(double x) noexcept;
    static double sign(double x) noexcept;
    static double sin(double x) noexcept;
    static double sinh(double x) noexcept;
    static double sqrt(double x) noexcept;
    static double tan(double x) noexcept;
    static double tanh(double x) noexcept;
    static double trunc(double x) noexcept;

    static double toInteger(double x) noexcept;
    static double modulo(double x, double y) noexcept;
    static uint32_t toUint32(double x) noexcept;
    static int32_t toInt32(double x) noexcept;

private:
    template <typename... Args>
    constexpr static void checkDoubleTraits(Args&... args)
    {
        forEachInTuple(std::tuple<Args...>{},
                       [](auto t)
                       { static_assert(std::is_floating_point<decltype(t)>::value, "Require float pointing type"); });
    }

    template <typename... Args>
    static bool hasNaN(Args&... args)
    {
        std::size_t countNaN = 0;
        forEachInTuple(std::make_tuple(args...), [&countNaN](double d) { countNaN += (NumberPrivate::isNaN(d)); });

        return countNaN != 0;
    }
};