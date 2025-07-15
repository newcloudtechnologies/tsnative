#pragma once

#include "details/internal_include1.h"
#include <TS.h>
#include <std/tsobject.h>

class TS_EXPORT Entity : public Object
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
