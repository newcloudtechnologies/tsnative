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

namespace console IS_TS_MODULE
{

template <typename T>
TS_EXPORT TS_SIGNATURE("function log(): void") void log(T t);

} // namespace IS_TS_MODULE

template <typename T>
void console::log(T t)
{
}
