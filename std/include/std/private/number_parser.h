#pragma once

#include <string>

class Number;
class Union;
class String;

class NumberParser final
{
public:
    static Number* parseInt(String* str, Union* radix) noexcept;

    static Number* parseFloat(String* str) noexcept;

    static double parseFloat(const std::string& str) noexcept;
};
