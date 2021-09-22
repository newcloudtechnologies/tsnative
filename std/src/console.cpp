#include <iostream>

#include "console.h"

template <>
void console::log(bool value)
{
    std::cout << std::boolalpha << value << std::endl;
}

template <>
void console::log(int8_t value)
{
    std::cout << static_cast<int16_t>(value) << std::endl;
}

template <>
void console::log(uint8_t value)
{
    std::cout << static_cast<uint16_t>(value) << std::endl;
}
