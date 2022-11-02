/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "std/tstuple.h"
#include "std/tsarray.h"
#include "std/tsstring.h"

#include "std/private/tsarray_std_p.h"

#include "std/private/logger.h"

Tuple::Tuple()
    : Object(TSTypeID::Tuple)
#ifdef USE_STD_ARRAY_BACKEND
    , _d(new DequeueBackend<Object*>())
#endif // USE_STD_ARRAY_BACKEND
{
    LOG_ADDRESS("Calling tuple ctor this= ", this);
}

Tuple::~Tuple()
{
    delete _d;
}

Number* Tuple::length() const
{
    return new Number(_d->length());
}

void* Tuple::operator[](Number* index)
{
    return operator[](static_cast<int>(index->unboxed()));
}

void* Tuple::operator[](int index)
{
    return _d->operator[](index);
}

void Tuple::push(Object* item)
{
    (void)_d->push(item);
}

String* Tuple::toString() const
{
    return new String(_d->toString());
}

void Tuple::markChildren()
{
    LOG_INFO("Calling Tuple::markChildren");
    for (int i = 0; i < _d->length(); ++i)
    {
        auto* o = static_cast<Object*>(_d->operator[](i));
        if (o && !o->isMarked())
        {
            LOG_ADDRESS("Mark child: ", o);
            o->mark();
        }
    }
}