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
#include "details/inheritance5_include.h"

class TS_EXPORT Entity
{
public:
    TS_METHOD void entity();
};

// export template specialization
template class TS_EXPORT Iterable<Entity*>;

class TS_EXPORT DerivedPointer : public Iterable<Entity*>
{
public:
    TS_METHOD void derived_pointer();
};
