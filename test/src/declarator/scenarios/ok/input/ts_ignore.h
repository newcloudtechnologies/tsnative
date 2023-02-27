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

class TS_EXPORT TS_IGNORE Entity : public Object
{
public:
    TS_METHOD Entity() = default;
    ~Entity() = default;

    TS_METHOD TS_IGNORE void update();
};
