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

#include "details/internal_include2.h"

namespace mgt IS_TS_MODULE
{

namespace exts IS_TS_NAMESPACE
{

class TS_EXPORT MyWidget : public ts::Widget
{
public:
    TS_METHOD MyWidget(mgt::ts::Widget& parent);
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE
