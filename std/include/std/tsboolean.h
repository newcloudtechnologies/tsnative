#pragma once

#include "std/private/options.h"

#include <iomanip>
#include <ostream>

#include "std/tsobject.h"

class Number;
class String;

class BooleanPrivate;

class Boolean : public Object
{
public:
    Boolean();
    Boolean(bool value);
    Boolean(Number* value);
    Boolean(String* value);

    ~Boolean() override;

    Boolean* negate() const;
    Boolean* equals(Boolean* other) const;

    Boolean* clone() const;

    String* toString() const override;
    Boolean* toBool() const override;

    bool unboxed() const;

    friend std::ostream& operator<<(std::ostream& os, const Boolean* v);

private:
    BooleanPrivate* _d = nullptr;
};

inline std::ostream& operator<<(std::ostream& os, const Boolean* v)
{
    os << std::boolalpha << v->unboxed();
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
