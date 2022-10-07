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

#include "TS.h"
#include "std/tsnumber.h"

TS_EXPORT Number* getNumber();

TS_EXPORT TS_NAME("capacity") Number* getCapacity();
TS_EXPORT TS_NAME("capacity") void setCapacity(Number* value);
