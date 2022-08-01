#include "std/tstuple.h"
#include "std/tsarray.h"
#include "std/tsstring.h"

#include "std/private/tsarray_std_p.h"

Tuple::Tuple()
#ifdef USE_STD_ARRAY_BACKEND
    : _d(new DequeueBackend<Object*>())
#endif // USE_STD_ARRAY_BACKEND
{
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
    std::ostringstream oss;
    oss << this;
    return new String(oss.str());
}

void Tuple::markChildren()
{
    for (int i = 0 ; i <_d->length() ; ++i)
    {
        auto* o = static_cast<Object*>(_d->operator[](i));
        if (o && !o->isMarked())
        {
            o->mark();
        }
    }
}