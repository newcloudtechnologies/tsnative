/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <ostream>

class String;
class Boolean;

class TS_DECLARE Undefined : public Object
{
private:
    Undefined();

public:
    ~Undefined() override = default;

    TS_METHOD static Undefined* instance();

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;
    TS_METHOD Boolean* equals(Object* other) const override;
};
