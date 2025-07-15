#include "std/tstuple.h"
#include "std/tsarray.h"
#include "std/tsstring.h"

#include "std/private/logger.h"
#include "std/private/tsarray_std_p.h"

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

void* Tuple::operator[](Number* index) const
{
    return operator[](static_cast<int>(index->unboxed()));
}

void* Tuple::operator[](int index) const
{
    return _d->operator[](index);
}

void Tuple::push(Object* item)
{
    (void)_d->push(item);
}

void Tuple::setElementAtIndex(Number* index, Object* value)
{
    int indexUnwrapped = static_cast<int>(index->unboxed());
    _d->setElementAtIndex(indexUnwrapped, value);
}

String* Tuple::toString() const
{
    return new String(_d->join(","));
}

std::vector<Object*> Tuple::getChildObjects() const
{
    auto result = Object::getChildObjects();
    for (int i = 0; i < _d->length(); ++i)
    {
        auto* o = static_cast<Object*>(_d->operator[](i));
        if (o)
        {
            result.push_back(o);
        }
    }

    return result;
}