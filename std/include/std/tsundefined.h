#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <ostream>

class String;
class Boolean;

class TS_DECLARE Undefined : public Object
{
public:
    TS_METHOD Undefined();
    ~Undefined() override = default;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;
};
