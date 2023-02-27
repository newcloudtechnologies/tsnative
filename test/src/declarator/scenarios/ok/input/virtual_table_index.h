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
#include <std/tsobject.h>

class TS_EXPORT WithVirtualMethods : public Object
{
public:
    TS_METHOD WithVirtualMethods() = default;

    TS_METHOD virtual void methodOne() const = 0;
    TS_METHOD void methodTwo() const;
    TS_METHOD virtual void methodThree() const = 0;
};
