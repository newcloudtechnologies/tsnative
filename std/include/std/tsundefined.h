#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <ostream>

class String;
class Boolean;

class TS_DECLARE Undefined : public Object
{
public:
    Undefined();
    ~Undefined() override = default;

    TS_METHOD static Undefined* instance();

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;
};
