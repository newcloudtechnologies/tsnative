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

#include <TS.h>

#include <std/tsobject.h>

namespace test IS_TS_MODULE
{

class TS_EXPORT Base : public Object
{
public:
    TS_METHOD Base();

    TS_METHOD void test();
};

} // namespace IS_TS_MODULE