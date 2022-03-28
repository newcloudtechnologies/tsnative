#pragma once

#include "std/tsobject.h"

#include <ostream>

class String;
class Boolean;

class Undefined : public Object
{
public:
    Undefined();
    ~Undefined() override = default;

    String* toString() const override;
    Boolean* toBool() const override;
};

inline std::ostream& operator<<(std::ostream& os, const Undefined*)
{
    os << "undefined";
    return os;
}
