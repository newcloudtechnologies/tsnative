#pragma once

#include "std/private/options.h"

#include "std/tsboolean.h"

#include <ostream>

class String;

class NumberPrivate;

class Number
{
public:
    Number(double v);
    Number(Number* v);

    String* toString();

    Number* add(Number* other) const;
    Number* sub(Number* other) const;
    Number* mul(Number* other) const;
    Number* div(Number* other) const;
    Number* mod(Number* other) const;

    Number* addInplace(Number* other);
    Number* subInplace(Number* other);
    Number* mulInplace(Number* other);
    Number* divInplace(Number* other);
    Number* modInplace(Number* other);

    Number* negate();

    Number* prefixIncrement();
    Number* postfixIncrement();

    Number* prefixDecrement();
    Number* postfixDecrement();

    Number* bitwiseAnd(Number* other) const;
    Number* bitwiseOr(Number* other) const;
    Number* bitwiseXor(Number* other) const;
    Number* bitwiseLeftShift(Number* other) const;
    Number* bitwiseRightShift(Number* other) const;

    Number* bitwiseAndInplace(Number* other);
    Number* bitwiseOrInplace(Number* other);
    Number* bitwiseXorInplace(Number* other);
    Number* bitwiseLeftShiftInplace(Number* other);
    Number* bitwiseRightShiftInplace(Number* other);

    Boolean* equals(Number* other) const;
    Boolean* lessThan(Number* other) const;
    Boolean* lessEqualsThan(Number* other) const;
    Boolean* greaterThan(Number* other) const;
    Boolean* greaterEqualsThan(Number* other) const;

    Boolean* toBool() const;

    double unboxed() const;

    Number* clone() const;

    friend std::ostream& operator<<(std::ostream& os, Number* v);

private:
    NumberPrivate* _d = nullptr;
};

inline std::ostream& operator<<(std::ostream& os, Number* v)
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
