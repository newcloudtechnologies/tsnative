#pragma once

#include <ostream>

#include <std/tsboolean.h>

class String;

class NumberPrivate;

class Number
{
public:
    Number(double v);
    Number(Number* v);

    String* toString();

    Number* add(const Number* other) const;
    Number* sub(const Number* other) const;
    Number* mul(const Number* other) const;
    Number* div(const Number* other) const;
    Number* mod(const Number* other) const;

    Number* addInplace(const Number* other);
    Number* subInplace(const Number* other);
    Number* mulInplace(const Number* other);
    Number* divInplace(const Number* other);
    Number* modInplace(const Number* other);

    Number* negate();

    Number* prefixIncrement();
    Number* postfixIncrement();

    Number* prefixDecrement();
    Number* postfixDecrement();

    Number* bitwiseAnd(const Number* other) const;
    Number* bitwiseOr(const Number* other) const;
    Number* bitwiseXor(const Number* other) const;
    Number* bitwiseLeftShift(const Number* other) const;
    Number* bitwiseRightShift(const Number* other) const;

    Number* bitwiseAndInplace(const Number* other);
    Number* bitwiseOrInplace(const Number* other);
    Number* bitwiseXorInplace(const Number* other);
    Number* bitwiseLeftShiftInplace(const Number* other);
    Number* bitwiseRightShiftInplace(const Number* other);

    Boolean* equals(const Number* other) const;
    Boolean* lessThan(const Number* other) const;
    Boolean* lessEqualsThan(const Number* other) const;
    Boolean* greaterThan(const Number* other) const;
    Boolean* greaterEqualsThan(const Number* other) const;

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
