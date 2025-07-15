#pragma once

#include <TS.h>
#include <std/tsnumber.h>
#include <std/tsobject.h>

namespace test IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

class TS_EXPORT Color : public Object
{
    static Color* createARGB(uint8_t a, uint8_t r, uint8_t g, uint8_t b);

public:
    Color() = default;
    ~Color() = default;

    TS_METHOD static Color* createRGB(Number* r, Number* g, Number* b);
    TS_METHOD static Color* createARGB(Number* a, Number* r, Number* g, Number* b);
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE
