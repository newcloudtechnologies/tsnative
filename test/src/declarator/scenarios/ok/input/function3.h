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

#include <TS.h>
#include <std/tsnumber.h>
#include <std/tsobject.h>

class TS_EXPORT Color : public Object
{
};

Color* createARGB(uint8_t a, uint8_t r, uint8_t g, uint8_t b);

TS_EXPORT Color* createRGB(Number* r, Number* g, Number* b);
TS_EXPORT Color* createARGB(Number* a, Number* r, Number* g, Number* b);
