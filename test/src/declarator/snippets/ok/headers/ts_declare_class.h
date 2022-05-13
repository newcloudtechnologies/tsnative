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

#include <TS.h>

class TS_DECLARE MyOuterClass
{
public:
    TS_METHOD MyOuterClass();
};

class TS_EXPORT TS_DECLARE ExportAndDeclareClass
{
public:
    TS_METHOD ExportAndDeclareClass();
};

namespace exts IS_TS_DECLARED_NAMESPACE
{

class TS_DECLARE MyInnerClass
{
public:
    TS_METHOD MyInnerClass();
};

} // namespace exts
