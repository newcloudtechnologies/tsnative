#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <ostream>

class String;
class Boolean;

class TS_DECLARE Null : public Object
{
public:
    Null();
    ~Null() override = default;

    TS_METHOD static Null* instance();

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;
};
