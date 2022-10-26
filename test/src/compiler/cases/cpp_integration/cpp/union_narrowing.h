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

#include <TS.h>

#include "std/tsobject.h"

class Number;

namespace cpp_integration IS_TS_MODULE
{
class TS_EXPORT UnionTest : public Object
{
    TS_METHOD UnionTest();

    TS_METHOD Number* bypass(Number* n) const;
};
} // namespace IS_TS_MODULE
