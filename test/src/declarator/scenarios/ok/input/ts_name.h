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
#include <std/tsobject.h>

enum TS_EXPORT TS_NAME("Types") TypesEnum{PLANT, ANIMAL, INSECT};

class TS_EXPORT TS_NAME("Collection") CollectionClass : public Object
{
public:
    /*
        // TODO: fix this case: [AN-819]
        enum TS_EXPORT TS_NAME("Types") TypesEnum
        {
            PLANT,
            ANIMAL,
            INSECT
        };
    */

public:
    TS_METHOD CollectionClass() = default;

    TS_METHOD TS_NAME("size") Number* getSize();
};

TS_EXPORT TS_NAME("getNumber") Number* getNum();
