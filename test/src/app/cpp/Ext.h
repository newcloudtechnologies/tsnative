/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

// #include "ExtBase.h"

#include <TS.h>

#include <std/tsstring.h>

namespace cpp
{

namespace ts
{

class TS_EXPORT Ext //: public ExtBase
{

public:
    Ext();
    // Ext(const string);

    TS_METHOD void dummy() const;

    // TS_METHOD const string* getText() const;
    // TS_METHOD void setText(const string& text);
};

} // namespace ts

} // namespace cpp
