#include "string.h"
#include <cstdio>
#include <iostream>

#include "console.h"

#include <assert.h>

#define assert_x(cond, message)                                  \
  do                                                             \
  {                                                              \
    if (!cond)                                                   \
    {                                                            \
      fprintf(stderr, ">>> Test failure: %s\r\n", message.data); \
      assert(cond);                                              \
    }                                                            \
  } while (false)

extern "C"
{
  void console__assert(bool value, string message)
  {
    assert_x(value, message);
  }
}

template <typename T>
void console::log(T value)
{
  std::cout << value << std::endl;
}

template <>
void console::log(string value)
{
  fwrite(value.data, 1, value.length, stdout);
  fwrite("\n", 1, 1, stdout);
};

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

template void console::log(int8_t);
template void console::log(int16_t);
template void console::log(int32_t);
template void console::log(uint8_t);
template void console::log(uint16_t);
template void console::log(uint32_t);
template void console::log(double);