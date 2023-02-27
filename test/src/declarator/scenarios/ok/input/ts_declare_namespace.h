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

namespace exts IS_TS_DECLARED_NAMESPACE
{

class TS_EXPORT MyClass : public Object
{
public:
    TS_METHOD MyClass();
};

} // namespace IS_TS_DECLARED_NAMESPACE
