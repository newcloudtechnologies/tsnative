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

#pragma once

#include <TS.h>
#include <std/tsarray.h>
#include <std/tsnumber.h>
#include <std/tsobject.h>

namespace test IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

class TS_EXPORT Color : public Object
{
    Color* createARGB(uint8_t a, uint8_t r, uint8_t g, uint8_t b);

public:
    Color() = default;
    ~Color() = default;

    TS_METHOD Color* createRGB(Number* r, Number* g, Number* b);
    TS_METHOD Color* createARGB(Number* a, Number* r, Number* g, Number* b);
};

class TS_EXPORT Palette : public Object
{
public:
    TS_METHOD Palette() = default;
};

TS_EXPORT Palette* makePalette(Array<Color*>* colors);

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE
