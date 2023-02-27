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

class TS_DECLARE MyOuterClass : public Object
{
public:
    TS_METHOD MyOuterClass();
};

class TS_EXPORT TS_DECLARE ExportAndDeclareClass : public Object
{
public:
    TS_METHOD ExportAndDeclareClass();
};

namespace exts IS_TS_DECLARED_NAMESPACE
{

class TS_DECLARE MyInnerClass : public Object
{
public:
    TS_METHOD MyInnerClass();
};

} // namespace IS_TS_DECLARED_NAMESPACE
