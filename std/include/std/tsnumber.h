#pragma once

#include <TS.h>

#include "std/private/options.h"

#include "std/tsboolean.h"
#include "std/tsobject.h"

#include <ostream>

class String;

class NumberPrivate;

class TS_DECLARE Number : public Object
{
public:
    TS_METHOD TS_SIGNATURE("constructor(_: any)") Number(double v);
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

    TS_METHOD Number* negate();

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

    TS_METHOD Boolean* equals(Number* other) const;
    TS_METHOD Boolean* lessThan(Number* other) const;
    TS_METHOD Boolean* lessEqualsThan(Number* other) const;
    TS_METHOD Boolean* greaterThan(Number* other) const;
    TS_METHOD Boolean* greaterEqualsThan(Number* other) const;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

    TS_METHOD TS_RETURN_TYPE("number") double unboxed() const;

    TS_METHOD Number* clone() const;

    friend std::ostream& operator<<(std::ostream& os, const Number* v);

private:
    NumberPrivate* _d = nullptr;
};

TS_CODE("// @ts-ignore\n"
        "declare type number = Number;\n");

inline std::ostream& operator<<(std::ostream& os, const Number* v)
{
    os << v->unboxed();
    return os;
}

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
