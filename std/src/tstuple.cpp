#include "std/tstuple.h"

#include "std/gc.h"
#include "std/tsarray.h"
#include "std/tsstring.h"

Tuple::Tuple()
    : _d(new Array<Object*>())
{
}

Tuple::~Tuple()
{
    // @todo: untrack elements?
    delete _d;
}

Number* Tuple::length() const
{
    return _d->length();
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
    std::ostringstream oss;
    oss << this;
    return GC::track(new String(oss.str()));
}
