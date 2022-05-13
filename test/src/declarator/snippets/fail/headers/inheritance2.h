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

/*
    Declarator failed:
    Multiple inheritance is not supported in TypeScript: class "Base"
*/

class TS_EXPORT Entity1
{
public:
    Entity1() = default;
    ~Entity1() = default;
    TS_METHOD void entity1();
};

class TS_EXPORT Entity2
{
public:
    Entity2() = default;
    ~Entity2() = default;
    TS_METHOD void entity2();
};

class TS_EXPORT Base : public Entity1, public Entity2
{
public:
    ~Base() = default;
    TS_METHOD void base1();
    TS_METHOD void base2();
    void base3();
};
