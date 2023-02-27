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

#include "std/private/number_parser.h"
#include "std/private/tsmath_p.h"
#include "std/private/tsnumber_p.h"
#include "std/tsnumber.h"
#include "std/tsstring.h"
#include "std/tsunion.h"

namespace
{
constexpr static const int g_MinRadix = 2;
constexpr static const int g_MaxRadix = 36;

int digitVal(char ch, int radix)
{
    if (radix < g_MinRadix || radix > g_MaxRadix)
    {
        return -1;
    }
    if (ch >= 'A' && ch <= 'Z' && ch < radix + 'A' - 10)
    {
        return ch - 'A' + 10;
    }
    if (ch >= 'a' && ch <= 'z' && ch < radix + 'a' - 10)
    {
        return ch - 'a' + 10;
    }
    if (ch >= '0' && ch <= '9' && ch < radix + '0')
    {
        return ch - '0';
    }
    return -1;
}

size_t trimBegin(const std::string& s, size_t currentPos)
{
    while (isspace(s[currentPos]))
    {
        ++currentPos;
    }
    return currentPos;
}

bool hasPrefix(const std::string& s, std::size_t idx)
{
    if ((s.size() - idx >= 2) && s[idx] == '0')
    {
        return (s[idx + 1] == 'X' || s[idx + 1] == 'x');
    }
    return false;
}

double parseIntImpl(const std::string& s, int radix)
{
    if (s.empty())
    {
        return NumberPrivate::NaN();
    }
    bool negative{false};
    size_t left = trimBegin(s, 0);
    double limit = -NumberPrivate::MAX_VALUE();

    if (s[left] == '-')
    {
        negative = true;
        limit = constants::DoubleTraits::lowest();
        ++left;
    }
    else if (s[left] == '+')
    {
        ++left;
    }
    if (hasPrefix(s, left))
    {
        if (radix == 0 || radix == 16)
        {
            radix = 16;
            left += 2;
        }
    }
    if (radix == 0)
    {
        radix = 10;
    }
    if (left >= s.size())
    {
        return NumberPrivate::NaN();
    }
    if (digitVal(s[left], radix) < 0)
    {
        return NumberPrivate::NaN();
    }

    double result{0};
    double mulLimit = MathPrivate::toInteger(limit / radix);
    int digit{0};

    while (left < s.size())
    {
        digit = digitVal(s[left++], radix);
        if (digit < 0)
        {
            break;
        }
        if (result < mulLimit)
        {
            break;
        }
        result *= radix;
        if (result < limit + digit)
        {
            break;
        }
        result -= digit;
    }
    return negative ? result : -result;
}
} // namespace

Number* NumberParser::parseInt(String* str, Union* radix) noexcept
{
    int32_t base{10};
    if (radix->hasValue())
    {
        auto unboxed = static_cast<Number*>(radix->getValue())->unboxed();
        base = MathPrivate::toInt32(unboxed);
    }
    double parsed = parseIntImpl(str->cpp_str(), base);

    return new Number{parsed};
}

Number* NumberParser::parseFloat(String* str) noexcept
{
    auto s = str->cpp_str();
    if (s.empty())
    {
        return Number::NaN();
    }
    size_t left = trimBegin(s, 0);

    bool negate = false;
    if (s[left] == '-')
    {
        negate = true;
    }

    if (hasPrefix(s, left))
    {
        return new Number{0.0};
    }

    try
    {
        return new Number{std::stod(s.substr(left))};
    }
    catch (const std::invalid_argument&)
    {
        return Number::NaN();
    }
    catch (std::out_of_range&)
    {
        return new Number{negate ? Number::NEGATIVE_INFINITY() : Number::POSITIVE_INFINITY()};
    }
}
