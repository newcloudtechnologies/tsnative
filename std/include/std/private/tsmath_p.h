#pragma once

#include <type_traits>
#include <cstdint> // std::uint8_t
#include <algorithm> // std::min, std::max

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
    template<typename Arg, typename ... Args>
    static Arg min(Arg first, Args ... tail) noexcept
    {
        static_assert(std::is_floating_point<Arg>::value, "Expected Arg's 'T' to be of floating point type");
        return std::min(first, min(tail...));
    }

    // Floating points cannot be template paramters according to c++ standard, so use typename and static_assertion
    template<typename Arg, typename ... Args>
    static Arg max(Arg first, Args ... tail) noexcept
    {
        static_assert(std::is_floating_point<Arg>::value, "Expected Arg's 'T' to be of floating point type");
        return std::max(first, max(tail...));
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

private:
    template<typename Arg>
    static Arg min(Arg arg) noexcept // variadic tail
    {
        return arg;
    }

        template<typename Arg>
    static Arg max(Arg arg) noexcept // variadic tail
    {
        return arg;
    }
};