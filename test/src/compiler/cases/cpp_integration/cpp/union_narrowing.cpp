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

#include "union_narrowing.h"

#include "std/tsnumber.h"

using namespace cpp_integration;

UnionTest::UnionTest()
{
}

Number* UnionTest::bypass(Number* n) const
{
    return n;
}
