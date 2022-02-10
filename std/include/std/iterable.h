#pragma once

#include <TS.h>

#include "std/private/options.h"

#include "std/gc.h"
#include "std/tsboolean.h"

#include <type_traits>

template <typename T>
class TS_EXPORT IteratorResult
{
public:
    IteratorResult(bool done, T value);

    TS_METHOD TS_GETTER Boolean *done() const;

    TS_METHOD TS_GETTER TS_RETURN_TYPE("T") typename std::conditional<std::is_pointer<T>::value, T, T*>::type value() const;

private:
    template <typename U = T>
    typename std::enable_if<std::is_pointer<U>::value, U>::type getPointerToValue() const
    {
        return _value;
    }

    template <typename U = T>
    typename std::enable_if<!std::is_pointer<U>::value, U>::type* getPointerToValue() const
    {
        return GC::createHeapAllocated<U>(_value);
    }

    Boolean* _done = nullptr;
    T _value;
};

template <typename T>
IteratorResult<T>::IteratorResult(bool done, T value)
    : _done(GC::createHeapAllocated<Boolean>(done)), _value(value)
{
}

template <typename T>
Boolean* IteratorResult<T>::done() const
{
    return _done;
}

template <typename T>
typename std::conditional<std::is_pointer<T>::value, T, T*>::type IteratorResult<T>::value() const
{
    return getPointerToValue();
}

template <typename T>
class TS_EXPORT Iterator
{
public:
    TS_METHOD virtual IteratorResult<T>* next() = 0;
};

template <typename T>
class TS_EXPORT Iterable
{
    TS_METHOD virtual Iterator<T>* iterator() = 0;
};

template <typename T>
class TS_EXPORT IterableIterator : public Iterator<T>
{
};
