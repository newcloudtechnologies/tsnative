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

#include "std/tsobject.h"
#include "std/tsunion.h"

template <class T>
T castFromUnion(Object* obj)
{
    while (obj->isUnion())
    {
        obj = static_cast<Union*>(obj)->getValue();
    }
    return assertCast<T>(obj);
}