#pragma once

#include <TS.h>
#include <std/tsnumber.h>

enum TS_EXPORT TS_NAME("Types") TypesEnum
{
    PLANT,
    ANIMAL,
    INSECT
};

class TS_EXPORT TS_NAME("Collection") CollectionClass
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

    TS_METHOD TS_NAME("size") Number getSize();
};

TS_EXPORT TS_NAME("getNumber") Number getNum();



