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
#include <std/tsarray.h>
#include <std/tsobject.h>
#include <std/tsstring.h>

#include <string>
#include <vector>

class TS_EXPORT Collection : public Object
{
public:
    TS_METHOD Collection() = default;

    TS_METHOD TS_RETURN_TYPE("Array<string>") Array<String*>* getStringList();
};

TS_EXPORT TS_RETURN_TYPE("Array<string>") Array<String*>* getStringList();
