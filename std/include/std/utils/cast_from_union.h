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