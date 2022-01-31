#pragma once

class String;
class Number;
class Boolean;

class NumberPrivate
{
public:
    NumberPrivate();
    NumberPrivate(double v);

    Number* add(const Number* other) const;
    Number* sub(const Number* other) const;
    Number* mul(const Number* other) const;
    Number* div(const Number* other) const;
    Number* mod(const Number* other) const;

    void addInplace(const Number* other);
    void subInplace(const Number* other);
    void mulInplace(const Number* other);
    void divInplace(const Number* other);
    void modInplace(const Number* other);

    void negate();

    void prefixIncrement();
    Number* postfixIncrement();

    void prefixDecrement();
    Number* postfixDecrement();

    Number* bitwiseAnd(const Number* other) const;
    Number* bitwiseOr(const Number* other) const;
    Number* bitwiseXor(const Number* other) const;
    Number* bitwiseLeftShift(const Number* other) const;
    Number* bitwiseRightShift(const Number* other) const;

    void bitwiseAndInplace(const Number* other);
    void bitwiseOrInplace(const Number* other);
    void bitwiseXorInplace(const Number* other);
    void bitwiseLeftShiftInplace(const Number* other);
    void bitwiseRightShiftInplace(const Number* other);

    Boolean* equals(const Number* other) const;
    Boolean* lessThan(const Number* other) const;
    Boolean* lessEqualsThan(const Number* other) const;
    Boolean* greaterThan(const Number* other) const;
    Boolean* greaterEqualsThan(const Number* other) const;

    Boolean* toBool() const;

    double unboxed() const;

private:
    double _value = 0.0;
};
