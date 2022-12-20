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
#include <std/tsarray.h>
#include <std/tsnumber.h>
#include <std/tsobject.h>
#include <std/tspromise.h>
#include <std/tsunion.h>

TS_EXPORT TS_SIGNATURE("function finally2(onFinally?: () => void): Promise") Promise* finally2(Union* onFinally);
TS_EXPORT TS_SIGNATURE("function finally3(onFinally?: (_: any) => void): Promise") Promise* finally3(Union* onFinally);
