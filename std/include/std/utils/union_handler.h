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

#include "std/utils/cast_from_union.h"

template <class TClass, class THandler>
void handleUnion(Object* maybeUnion, const THandler& handler)
{
    try
    {
        auto expectedType = castFromUnion<TClass*>(maybeUnion);
        handler(expectedType);
    }
    catch (const BadCast& e)
    {
    }
};