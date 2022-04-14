#pragma once

#include <TS.h>

#include "std/private/options.h"

#include <iomanip>
#include <ostream>

#include "std/tsobject.h"

class Number;
class String;

class BooleanPrivate;

class TS_DECLARE Boolean : public Object
{
public:
    TS_METHOD TS_SIGNATURE("constructor(_: any)") Boolean();
    Boolean(bool value);
    Boolean(Number* value);
    Boolean(String* value);

    ~Boolean() override;

    TS_METHOD Boolean* negate() const;
    TS_METHOD Boolean* equals(Boolean* other) const;
    TS_METHOD Boolean* clone() const;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

    TS_METHOD TS_RETURN_TYPE("number") bool unboxed() const;

    friend std::ostream& operator<<(std::ostream& os, const Boolean* v);

private:
    BooleanPrivate* _d = nullptr;
};

TS_CODE("// @ts-ignore\n"
        "declare type boolean = Boolean;\n");

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
