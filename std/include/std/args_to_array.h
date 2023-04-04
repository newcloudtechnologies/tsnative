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

#include "std/tsarray.h"

class String;
class Boolean;

class TS_DECLARE ArgsToArray final : public Object
{
public:
    TS_METHOD ArgsToArray(Array<Object*>* aggregator) noexcept;

    TS_METHOD void addObject(Object* nextArg, Boolean* isSpread) noexcept;

private:
    Array<Object*>& m_aggregator;
};
