#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <ostream>

class String;
class Boolean;

class TS_DECLARE Null : public Object
{
public:
    TS_METHOD Null();
    ~Null() override = default;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;
};

inline std::ostream& operator<<(std::ostream& os, const Null*)
{
    os << "null";
    return os;
}
