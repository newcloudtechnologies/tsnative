#pragma once

#include "std/private/tsboolean_p.h"

class BooleanCXXBuiltinPrivate : public BooleanPrivate
{
public:
    BooleanCXXBuiltinPrivate() = default;
    BooleanCXXBuiltinPrivate(bool value);

    ~BooleanCXXBuiltinPrivate() = default;

    bool value() const;
    void setValue(bool value);

private:
    bool _value = false;
};
