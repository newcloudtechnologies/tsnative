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