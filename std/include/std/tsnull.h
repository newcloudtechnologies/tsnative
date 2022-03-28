#pragma once

#include "std/tsobject.h"

#include <ostream>

class String;
class Boolean;

class Null : public Object
{
public:
    Null();
    ~Null() override = default;

    String* toString() const override;
    Boolean* toBool() const override;
};

inline std::ostream& operator<<(std::ostream& os, const Null*)
{
    os << "null";
    return os;
}
