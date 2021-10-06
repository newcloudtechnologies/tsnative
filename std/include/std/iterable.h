#pragma once

#include "gc.h"

#include <type_traits>

template <typename T>
class IteratorResult
{
public:
    IteratorResult(bool done, T value);

    bool done() const;

    typename std::conditional<std::is_pointer<T>::value, T, T*>::type value() const;

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

    bool _done;
    T _value;
};

template <typename T>
IteratorResult<T>::IteratorResult(bool done, T value)
    : _done(done)
    , _value(value)
{
}

template <typename T>
bool IteratorResult<T>::done() const
{
    return _done;
}

template <typename T>
typename std::conditional<std::is_pointer<T>::value, T, T*>::type IteratorResult<T>::value() const
{
    return getPointerToValue();
}

template <typename T>
class Iterator
{
public:
    virtual IteratorResult<T>* next() = 0;
};

template <typename T>
class Iterable
{
    virtual Iterator<T>* iterator() = 0;
};

template <typename T>
class IterableIterator : public Iterator<T>
{
};
