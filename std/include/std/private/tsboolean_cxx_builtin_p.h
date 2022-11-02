/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

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
