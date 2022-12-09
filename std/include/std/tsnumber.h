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

#include "std/private/options.h"

#include "std/tsboolean.h"
#include "std/tsobject.h"

#include <TS.h>

#include <ostream>

class String;

class NumberPrivate;

class TS_DECLARE Number : public Object
{
public:
    TS_METHOD TS_GETTER static Number* NaN() noexcept;
    TS_METHOD TS_GETTER static Number* POSITIVE_INFINITY() noexcept;
    TS_METHOD TS_GETTER static Number* NEGATIVE_INFINITY() noexcept;
    TS_METHOD TS_GETTER static Number* EPSILON() noexcept;
    TS_METHOD TS_GETTER static Number* MAX_VALUE() noexcept;
    TS_METHOD TS_GETTER static Number* MIN_VALUE() noexcept;
    TS_METHOD TS_GETTER static Number* MAX_SAFE_INTEGER() noexcept;
    TS_METHOD TS_GETTER static Number* MIN_SAFE_INTEGER() noexcept;

    TS_METHOD static Boolean* isNaN(Object* value) noexcept;
    TS_METHOD static Boolean* isFinite(Object* value) noexcept;
    TS_METHOD static Boolean* isInteger(Object* value) noexcept;
    TS_METHOD static Boolean* isSafeInteger(Object* value) noexcept;

    TS_METHOD TS_NO_CHECK TS_SIGNATURE("constructor(_: any)") Number(double v);
    Number(Number* v);

    ~Number() override;

    TS_METHOD Number* add(Number* other) const;
    TS_METHOD Number* sub(Number* other) const;
    TS_METHOD Number* mul(Number* other) const;
    TS_METHOD Number* div(Number* other) const;
    TS_METHOD Number* mod(Number* other) const;

    TS_METHOD Number* addInplace(Number* other);
    TS_METHOD Number* subInplace(Number* other);
    TS_METHOD Number* mulInplace(Number* other);
    TS_METHOD Number* divInplace(Number* other);
    TS_METHOD Number* modInplace(Number* other);

    TS_METHOD Number* negate() const;

    TS_METHOD Number* prefixIncrement();
    TS_METHOD Number* postfixIncrement();

    TS_METHOD Number* prefixDecrement();
    TS_METHOD Number* postfixDecrement();

    TS_METHOD Number* bitwiseAnd(Number* other) const;
    TS_METHOD Number* bitwiseOr(Number* other) const;
    TS_METHOD Number* bitwiseXor(Number* other) const;
    TS_METHOD Number* bitwiseLeftShift(Number* other) const;
    TS_METHOD Number* bitwiseRightShift(Number* other) const;

    TS_METHOD Number* bitwiseAndInplace(Number* other);
    TS_METHOD Number* bitwiseOrInplace(Number* other);
    TS_METHOD Number* bitwiseXorInplace(Number* other);
    TS_METHOD Number* bitwiseLeftShiftInplace(Number* other);
    TS_METHOD Number* bitwiseRightShiftInplace(Number* other);

    TS_METHOD Boolean* lessThan(Number* other) const;
    TS_METHOD Boolean* lessEqualsThan(Number* other) const;
    TS_METHOD Boolean* greaterThan(Number* other) const;
    TS_METHOD Boolean* greaterEqualsThan(Number* other) const;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;
    TS_METHOD Boolean* equals(Object* other) const override;

    TS_METHOD TS_NO_CHECK TS_RETURN_TYPE("number") double unboxed() const;

    TS_METHOD Number* clone() const;

private:
    NumberPrivate* _d = nullptr;
};

TS_CODE("// @ts-ignore\n"
        "declare type number = Number;\n"
        "declare var NaN: number;\n"
        "declare var Infinity: number;\n");

namespace std
{
template <>
struct equal_to<::Number*>
{
    bool operator()(::Number* const& lhs, ::Number* const& rhs) const
    {
        return lhs->equals(rhs)->unboxed();
    }
};
} // namespace std
