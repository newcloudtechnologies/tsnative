#pragma once

#include "std/private/options.h"

#include <ostream>

class Number;
class String;

class BooleanPrivate;

class Boolean
{
public:
    Boolean();
    Boolean(bool value);
    Boolean(Number* value);
    Boolean(String* value);

    ~Boolean();

    Boolean* negate() const;
    Boolean* equals(Boolean* other) const;

    Boolean* clone() const;

    String* toString() const;

    bool unboxed() const;

    friend std::ostream& operator<<(std::ostream& os, Boolean* v);

private:
    BooleanPrivate* _d = nullptr;
};

inline std::ostream& operator<<(std::ostream& os, Boolean* v)
{
    os << v->unboxed();
    return os;
}

namespace std
{
template <>
struct equal_to<::Boolean*>
{
    bool operator()(::Boolean* const& lhs, ::Boolean* const& rhs) const
    {
        return lhs->equals(rhs)->unboxed();
    }
};
} // namespace std
