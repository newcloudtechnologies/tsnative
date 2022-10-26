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

namespace cpp_integration IS_TS_MODULE
{
enum TS_EXPORT E
{
    Auto = 0,
    Manual
};

class TS_EXPORT EnumArgs : public Object
{
    TS_METHOD EnumArgs(E e);

    TS_METHOD E test(E e) const;
};

} // namespace IS_TS_MODULE