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

class TS_EXPORT TS_DECORATOR("NoFields") TS_DECORATOR("MapsTo('Pi', 3.14)") Entity
{
public:
    TS_METHOD Entity() = default;
    ~Entity() = default;

    TS_METHOD TS_DECORATOR("Function(1, 2, 'str', 3.14)") TS_DECORATOR("NoRet")
        TS_DECORATOR("MapsTo('iterator')") void update();
};

/*
TODO: support generics

template <typename T>
class TS_EXPORT TS_DECORATOR("Generic") Array
{
public:
    Array();
};
*/
