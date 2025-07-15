#pragma once

#include <TS.h>
#include <std/tsnumber.h>
#include <std/tsobject.h>

class TS_EXPORT Color : public Object
{
};

Color* createARGB(uint8_t a, uint8_t r, uint8_t g, uint8_t b);

TS_EXPORT Color* createRGB(Number* r, Number* g, Number* b);
TS_EXPORT Color* createARGB(Number* a, Number* r, Number* g, Number* b);
