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
#include <std/tsnumber.h>

// Test case for TSN-85 TS_DECLARE is ignored for standalone functions
TS_DECLARE void clearTimeout(Number* handle);
TS_EXPORT TS_DECLARE void createTimeout(Number* handle);
