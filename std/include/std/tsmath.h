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

#include "std/tsobject.h"

#include <ostream>

class Number;

// https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Math/
class TS_DECLARE Math : public Object
{
public:
    Math() = delete;

    TS_METHOD TS_GETTER static Number* E() noexcept;
    TS_METHOD TS_GETTER static Number* LN2() noexcept;
    TS_METHOD TS_GETTER static Number* LN10() noexcept;
    TS_METHOD TS_GETTER static Number* LOG2E() noexcept;
    TS_METHOD TS_GETTER static Number* LOG10E() noexcept;
    TS_METHOD TS_GETTER static Number* PI() noexcept;
    TS_METHOD TS_GETTER static Number* SQRT1_2() noexcept;
    TS_METHOD TS_GETTER static Number* SQRT2() noexcept;

    TS_METHOD static Number* abs(Number* x) noexcept;
    TS_METHOD static Number* acos(Number* x) noexcept;
    TS_METHOD static Number* acosh(Number* x) noexcept;
    TS_METHOD static Number* asin(Number* x) noexcept;
    TS_METHOD static Number* asinh(Number* x) noexcept;
    TS_METHOD static Number* atan(Number* x) noexcept;
    TS_METHOD static Number* atanh(Number* x) noexcept;
    TS_METHOD static Number* atan2(Number* y, Number* x) noexcept;
    TS_METHOD static Number* cbrt(Number* x) noexcept;
    TS_METHOD static Number* ceil(Number* x) noexcept;
    TS_METHOD static Number* clz32(Number* x) noexcept;
    TS_METHOD static Number* cos(Number* x) noexcept;
    TS_METHOD static Number* cosh(Number* x) noexcept;
    TS_METHOD static Number* exp(Number* x) noexcept;
    TS_METHOD static Number* expm1(Number* x) noexcept;
    TS_METHOD static Number* floor(Number* x) noexcept;
    TS_METHOD static Number* fround(Number* x) noexcept;

    // TODO https://jira.ncloudtech.ru:8090/browse/AN-1062
    // Support multiple arguments passing
    TS_METHOD static Number* hypot(Number* x, Number* y) noexcept;

    // TODO https://jira.ncloudtech.ru:8090/browse/AN-1062
    // Support multiple arguments passing
    TS_METHOD static Number* imul(Number* x, Number* y) noexcept;

    TS_METHOD static Number* log(Number* x) noexcept;
    TS_METHOD static Number* log1p(Number* x) noexcept;
    TS_METHOD static Number* log10(Number* x) noexcept;
    TS_METHOD static Number* log2(Number* x) noexcept;

    // TODO https://jira.ncloudtech.ru:8090/browse/AN-1062
    // Support multiple arguments passing

    // TODO https://jira.ncloudtech.ru:8090/browse/AN-1064
    // Max without arguments should return INFINITY(==Number.PositiveInfinity) constant
    // It is based on Number.PositiveInfinity which is not supported in Number class.
    // Arithmetic operations with infinity should be correctly supported by Number class.
    TS_METHOD static Number* max(Number* a, Number* b) noexcept;

    // TODO https://jira.ncloudtech.ru:8090/browse/AN-1062
    // Support multiple arguments passing

    // TODO https://jira.ncloudtech.ru:8090/browse/AN-1064
    // Min without arguments should return INFINITY(==Number.PositiveInfinity) constant
    // It is based on Number.PositiveInfinity which is not supported in Number class.
    // Arithmetic operations with infinity should be correctly supported by Number class.
    TS_METHOD static Number* min(Number* a, Number* b) noexcept;

    TS_METHOD static Number* pow(Number* x, Number* y) noexcept;

    TS_METHOD static Number* random() noexcept;

    TS_METHOD static Number* round(Number* x) noexcept;
    TS_METHOD static Number* sign(Number* x) noexcept;
    TS_METHOD static Number* sin(Number* x) noexcept;
    TS_METHOD static Number* sinh(Number* x) noexcept;
    TS_METHOD static Number* sqrt(Number* x) noexcept;
    TS_METHOD static Number* tan(Number* x) noexcept;
    TS_METHOD static Number* tanh(Number* x) noexcept;
    TS_METHOD static Number* trunc(Number* x) noexcept;

    TS_METHOD String* toString() const override;
};
