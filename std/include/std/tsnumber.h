#pragma once

#include <ostream>

class string;

class Number
{
public:
    Number(double v);
    Number(Number* v);

    template <typename T>
    operator T()
    {
        static_assert(std::is_arithmetic<T>::value);

        return static_cast<T>(_value);
    }

    string* toString();

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

    bool equals(const Number* other) const;
    bool lessThan(const Number* other) const;
    bool lessEqualsThan(const Number* other) const;
    bool greaterThan(const Number* other) const;
    bool greaterEqualsThan(const Number* other) const;

    bool toBool() const;

    double valueOf() const
    {
        return _value;
    }

    friend std::ostream& operator<<(std::ostream& os, Number* v);

private:
    double _value = 0.0;
};

inline std::ostream& operator<<(std::ostream& os, Number* v)
{
    os << v->_value;
    return os;
}

namespace std
{
template <>
struct equal_to<::Number*>
{
    bool operator()(::Number* const& lhs, ::Number* const& rhs) const
    {
        return lhs->equals(rhs);
    }
};
} // namespace std
